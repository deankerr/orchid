import { ConvexError, v } from 'convex/values'
import { z } from 'zod'
import { internal } from './_generated/api'
import { internalAction } from './_generated/server'
import { openrouter } from './openrouter/client'

export const syncProviders = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const result = await openrouter.frontend.allProviders()
    await ctx.runMutation(internal.snapshots.insertSnapshot, {
      category: 'providers',
      key: '',
      epoch,
      data: result,
    })

    if (!result.success) {
      console.error('Failed to sync providers', result.error)
    }
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
        data: result,
      })

      throw new ConvexError({ message: 'Failed to sync models', epoch })
    }

    if (!Array.isArray(result.data)) {
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        category: 'models',
        key: '',
        epoch,
        data: { ...result, success: false },
      })
      throw new ConvexError({ message: 'Invalid models data', epoch })
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
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        category: 'models',
        key: '',
        epoch,
        data: { ...result, success: false },
      })
      throw new ConvexError({ message: 'Invalid models data', epoch, issues: models.error.flatten() })
    }

    await ctx.runMutation(internal.snapshots.insertSnapshot, {
      category: 'models',
      key: '',
      epoch,
      data: { success: true, data: models.data },
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
      category: 'model-list',
      key: '',
      epoch,
      data: { success: true, data: modelList },
    })

    await ctx.scheduler.runAfter(0, internal.sync.syncEndpoints, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.syncRecentUptimes, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.syncApps, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.syncModelAuthors, { epoch })
  },
})

export const syncEndpoints = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const modelList = await ctx.runQuery(internal.snapshots.getEpochModelList, { epoch })
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
          data: result,
        })
        console.error('Failed to sync endpoint', modelId, params, result.error)
        continue
      }

      const endpoints = z.object({ id: z.string() }).passthrough().array().safeParse(result.data)

      if (!endpoints.success) {
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          category: 'endpoints',
          key: modelId,
          epoch,
          data: { ...result, success: false },
        })
        console.error('Failed to parse endpoint ids', modelId, params, endpoints.error.flatten())
        continue
      }

      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        category: 'endpoints',
        key: modelId,
        epoch,
        data: { success: true, data: endpoints.data },
      })

      endpointIdsList.push({ modelId, endpointIds: endpoints.data.map((e) => e.id) })
    }

    await ctx.runMutation(internal.snapshots.insertSnapshot, {
      category: 'endpoint-ids-list',
      key: '',
      epoch,
      data: { success: true, data: endpointIdsList },
    })

    await ctx.scheduler.runAfter(0, internal.sync.syncHourlyUptimes, { epoch })
  },
})

export const syncHourlyUptimes = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const endpointIdsList = await ctx.runQuery(internal.snapshots.getEpochEndpointIdsList, { epoch })
    if (!endpointIdsList) {
      throw new ConvexError({ message: 'Failed to get endpoint ids list', epoch })
    }

    for (const { modelId, endpointIds } of endpointIdsList) {
      const uptimeMap = new Map<string, unknown>()
      for (const endpointId of endpointIds) {
        const result = await openrouter.frontend.stats.uptimeHourly({ id: endpointId })
        uptimeMap.set(endpointId, result)
      }

      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        category: 'uptime-hourly',
        key: modelId,
        epoch,
        data: { success: true, data: Object.fromEntries(uptimeMap) },
      })
    }
  },
})

export const syncRecentUptimes = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const modelList = await ctx.runQuery(internal.snapshots.getEpochModelList, { epoch })
    if (!modelList) {
      throw new ConvexError({ message: 'Failed to get model list', epoch })
    }

    for (const { modelId, params } of modelList) {
      const result = await openrouter.frontend.stats.uptimeRecent(params)
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        category: 'uptime-recent',
        key: modelId,
        epoch,
        data: result,
      })
    }
  },
})

export const syncApps = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const modelList = await ctx.runQuery(internal.snapshots.getEpochModelList, { epoch })
    if (!modelList) {
      throw new ConvexError({ message: 'Failed to get model list', epoch })
    }

    for (const { modelId, params } of modelList) {
      const result = await openrouter.frontend.stats.app(params)
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        category: 'apps',
        key: modelId,
        epoch,
        data: result,
      })
    }
  },
})

export const syncModelAuthors = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const modelList = await ctx.runQuery(internal.snapshots.getEpochModelList, { epoch })
    if (!modelList) {
      throw new ConvexError({ message: 'Failed to get model list', epoch })
    }

    const authorSlugs = new Set(modelList.map((m) => m.author))

    for (const authorSlug of authorSlugs) {
      const result = await openrouter.frontend.modelAuthor({
        authorSlug,
        shouldIncludeStats: true,
        shouldIncludeVariants: false,
      })

      if (!result.success) {
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          category: 'model-author',
          key: authorSlug,
          epoch,
          data: result,
        })
        console.error('Failed to sync model author', authorSlug, result.error)
        continue
      }

      // author data
      const authorsResult = z
        .object({
          author: z.record(z.string(), z.unknown()),
        })
        .safeParse(result.data)

      if (!authorsResult.success) {
        // we can't store the entire result on error because it's too big
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          category: 'model-author',
          key: authorSlug,
          epoch,
          data: {
            success: false,
            error: {
              type: 'validation',
              message: 'Invalid model author data',
              details: authorsResult.error.flatten(),
            },
          },
        })
        console.error('Failed to parse model author', authorSlug, authorsResult.error.flatten())
        continue
      } else {
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          category: 'model-author',
          key: authorSlug,
          epoch,
          data: { success: true, data: authorsResult.data },
        })
      }

      // models with stats
      const modelsWithStatsResult = z
        .object({
          modelsWithStats: z
            .object({
              stats: z.record(z.string(), z.unknown()).array(),
              endpoint: z
                .object({
                  model_variant_slug: z.string(),
                })
                .nullable(),
            })
            .array(),
        })
        .safeParse(result.data)

      if (!modelsWithStatsResult.success) {
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          category: 'model-author',
          key: authorSlug,
          epoch,
          data: {
            success: false,
            error: {
              type: 'validation',
              message: 'Invalid model author stats',
              details: modelsWithStatsResult.error.flatten(),
            },
          },
        })
        console.error('Failed to parse model author stats', authorSlug, modelsWithStatsResult.error.flatten())
        continue
      }

      for (const modelStats of modelsWithStatsResult.data.modelsWithStats) {
        const { stats, endpoint } = modelStats

        if (endpoint === null) {
          // no endpoint means no stats
          continue
        }

        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          category: 'model-stats',
          key: endpoint.model_variant_slug,
          epoch,
          data: { success: true, data: stats },
        })
      }
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
