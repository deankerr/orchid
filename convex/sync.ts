import { ConvexError, v, type Infer } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction, internalQuery } from './_generated/server'
import { openrouter } from './openrouter/client'
import { z } from 'zod'
import { nullable } from 'convex-helpers/validators'

export const syncProviders = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const result = await openrouter.frontend.allProviders()

    if (!result.success) {
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        category: 'providers',
        key: '',
        epoch,
        data: { error: result.error },
      })

      console.error('Failed to sync providers', result.error)
      return
    }

    await ctx.runMutation(internal.snapshots.insertSnapshot, {
      category: 'providers',
      key: '',
      epoch,
      data: { providers: result.data },
    })
  },
})

export const syncModels = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const result = await openrouter.frontend.models()
    if (!result.success) {
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        category: 'models',
        key: '',
        epoch,
        data: { error: result.error },
      })
      console.error('Failed to sync models', result.error)
      return
    }

    const ModelListDataSchema = z.object({
      author: z.string(),
      permaslug: z.string(),
      endpoint: z
        .object({
          id: z.string(),
          model_variant_slug: z.string(),
          variant: z.string(),
        })
        .nullable(),
    })

    const models = ModelListDataSchema.passthrough().array().safeParse(result.data)
    if (!models.success) {
      throw new ConvexError({ message: 'Failed to get models', epoch })
    }

    await ctx.runMutation(internal.snapshots.insertSnapshot, {
      category: 'models',
      key: '',
      epoch,
      data: { models: models.data },
    })

    const modelList = models.data
      .map((m) => {
        const { author, permaslug, endpoint } = m
        if (!endpoint) {
          return null
        }

        return {
          modelId: endpoint.model_variant_slug,
          author,
          params: { permaslug, variant: endpoint.variant },
          topEndpointId: endpoint.id,
        }
      })
      .filter((m) => m !== null)

    await ctx.runMutation(internal.snapshots.insertSnapshot, {
      category: 'modelList',
      key: '',
      epoch,
      data: { modelList },
    })

    await ctx.scheduler.runAfter(0, internal.sync.syncEndpoints, { epoch })
  },
})

const vModelList = v.array(
  v.object({
    modelId: v.string(),
    author: v.string(),
    params: v.object({ permaslug: v.string(), variant: v.string() }),
    topEndpointId: v.string(),
  }),
)

export const getModelList = internalQuery({
  args: {
    epoch: v.number(),
  },
  returns: nullable(vModelList),
  handler: async (ctx, { epoch }) => {
    const snapshot = await ctx.db
      .query('snapshots')
      .withIndex('by_category_key_epoch', (q) =>
        q.eq('category', 'modelList').eq('key', '').eq('epoch', epoch),
      )
      .first()

    if (!snapshot || typeof snapshot.data !== 'string') {
      return null
    }

    try {
      const { modelList } = JSON.parse(snapshot.data) as { modelList: Infer<typeof vModelList> }
      return modelList
    } catch (error) {
      console.error('Failed to parse model list', error)
      return null
    }
  },
})

export const syncEndpoints = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const modelList = await ctx.runQuery(internal.sync.getModelList, { epoch })
    if (!modelList) {
      throw new ConvexError({ message: 'Failed to get model list', epoch })
    }

    const endpointIdsList: { modelId: string; endpointIds: string[] }[] = []

    for (const { modelId, params } of modelList) {
      const result = await openrouter.frontend.stats.endpoint(params)
      if (!result.success) {
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          category: 'endpoints',
          key: modelId,
          epoch,
          data: { error: result.error },
        })
        console.error('Failed to sync endpoint', modelId, params, result.error)
        continue
      }

      const endpoints = result.data
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        category: 'endpoints',
        key: modelId,
        epoch,
        data: { endpoints },
      })

      const endpointIds = z.object({ id: z.string() }).array().safeParse(endpoints)
      if (!endpointIds.success) {
        console.error('Failed to parse endpoint ids', modelId, params, endpoints)
        continue
      }

      endpointIdsList.push({ modelId, endpointIds: endpointIds.data.map((e) => e.id) })
    }

    await ctx.runMutation(internal.snapshots.insertSnapshot, {
      category: 'endpointIdsList',
      key: '',
      epoch,
      data: { endpointIdsList },
    })

    await ctx.scheduler.runAfter(0, internal.sync.syncUptimes, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.syncApp, { epoch })
  },
})

const vEndpointIdsList = v.array(
  v.object({
    modelId: v.string(),
    endpointIds: v.array(v.string()),
  }),
)

export const getEndpointIdsList = internalQuery({
  args: {
    epoch: v.number(),
  },
  returns: nullable(vEndpointIdsList),
  handler: async (ctx, { epoch }) => {
    const snapshot = await ctx.db
      .query('snapshots')
      .withIndex('by_category_key_epoch', (q) =>
        q.eq('category', 'endpointIdsList').eq('key', '').eq('epoch', epoch),
      )
      .first()

    if (!snapshot || typeof snapshot.data !== 'string') {
      return null
    }

    try {
      const { endpointIdsList } = JSON.parse(snapshot.data) as {
        endpointIdsList: Infer<typeof vEndpointIdsList>
      }
      return endpointIdsList
    } catch (error) {
      console.error('Failed to parse endpoint ids list', error)
      return null
    }
  },
})

export const syncUptimes = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const endpointIdsList = await ctx.runQuery(internal.sync.getEndpointIdsList, { epoch })
    if (!endpointIdsList) {
      throw new ConvexError({ message: 'Failed to get endpoint ids list', epoch })
    }

    for (const { modelId, endpointIds } of endpointIdsList) {
      for (const endpointId of endpointIds) {
        const hourly = await openrouter.frontend.stats.uptimeHourly({ id: endpointId })

        if (!hourly.success) {
          console.error('Failed to sync uptime', modelId, endpointId, hourly.error)
          await ctx.runMutation(internal.snapshots.insertSnapshot, {
            category: 'uptimes',
            key: modelId,
            epoch,
            data: { error: hourly.error },
          })
          continue
        }

        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          category: 'hourly-uptime',
          key: modelId,
          epoch,
          data: { hourly: hourly.data },
        })
      }
    }
  },
})

export const syncApp = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const modelList = await ctx.runQuery(internal.sync.getModelList, { epoch })
    if (!modelList) {
      throw new ConvexError({ message: 'Failed to get model list', epoch })
    }

    for (const { modelId, params } of modelList) {
      const result = await openrouter.frontend.stats.app(params)
      if (!result.success) {
        console.error('Failed to sync app', modelId, params, result.error)
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          category: 'app',
          key: modelId,
          epoch,
          data: { error: result.error },
        })
        continue
      }

      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        category: 'app',
        key: modelId,
        epoch,
        data: { app: result.data },
      })
    }
  },
})

export const start = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx) => {
    const epoch = Date.now() // NOTE: temporary during dev
    await ctx.scheduler.runAfter(0, internal.sync.syncProviders, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.syncModels, { epoch })
  },
})
