import { v, type Infer } from 'convex/values'
import { z } from 'zod'
import { internal } from './_generated/api'
import { internalAction } from './_generated/server'
import { openrouter } from './openrouter/client'
import type { vModelList } from './snapshots'

export const syncProviders = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const result = await openrouter.frontend.allProviders()

    if (!result.success) {
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'providers',
        epoch,
        data: result,
      })
      return
    }

    const providersResult = z
      .object({
        slug: z.string(),
      })
      .passthrough()
      .array()
      .safeParse(result.data)

    if (!providersResult.success) {
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'providers',
        epoch,
        data: {
          success: false,
          error: {
            type: 'validation',
            message: 'Failed to parse providers',
            details: providersResult.error.flatten(),
          },
        },
      })
      return
    }

    for (const provider of providersResult.data) {
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'provider',
        resourceId: provider.slug,
        epoch,
        data: { success: true, data: provider },
      })
    }

    // Track completion
    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'providers',
      epoch,
      event: 'completed',
      metadata: { itemCount: providersResult.data.length },
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
        resourceType: 'models',
        epoch,
        data: result,
      })
      return
    }

    const ModelSchema = z.object({
      author: z.string(),
      slug: z.string(),
      permaslug: z.string(),
      endpoint: z
        .object({
          id: z.string(),
          model_variant_slug: z.string(),
          variant: z.string(),
        })
        .nullable(),
    })

    const modelList: Infer<typeof vModelList> = []
    for (const data of result.data) {
      const model = ModelSchema.safeParse(data)
      if (!model.success) {
        console.error('Failed to parse model', data, model.error.flatten())
        continue
      }

      const { author, slug, permaslug, endpoint } = model.data

      const modelId = endpoint?.model_variant_slug ?? slug

      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'model',
        resourceId: modelId,
        epoch,
        data: { success: true, data: model.data },
      })

      modelList.push({
        modelId,
        author,
        slug,
        permaslug,
        variant: endpoint?.variant,
        topEndpointId: endpoint?.id,
      })
    }

    await ctx.runMutation(internal.snapshots.insertSnapshot, {
      resourceType: 'model-list',
      epoch,
      data: { success: true, data: modelList },
    })

    await ctx.scheduler.runAfter(0, internal.sync.syncEndpoints, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.syncRecentUptimes, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.syncApps, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.syncModelAuthors, { epoch })

    // Track completion
    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'models',
      epoch,
      event: 'completed',
      metadata: { itemCount: modelList.length },
    })
  },
})

export const syncEndpoints = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const modelList = await ctx.runQuery(internal.snapshots.getEpochModelList, { epoch })

    const endpointIdsList: { modelId: string; endpointIds: string[] }[] = []

    for (const { modelId, permaslug, variant } of modelList) {
      if (!variant) {
        // no variant means endpoints will 404
        continue
      }

      const endpoint = { permaslug, variant }
      const result = await openrouter.frontend.stats.endpoint(endpoint)
      if (!result.success) {
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          resourceType: 'endpoints',
          resourceId: modelId,
          epoch,
          data: result,
        })
        continue
      }

      const endpoints = z.object({ id: z.string() }).passthrough().array().safeParse(result.data)

      if (!endpoints.success) {
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          resourceType: 'endpoints',
          resourceId: modelId,
          epoch,
          data: { ...result, success: false },
        })
        continue
      }

      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'endpoints',
        resourceId: modelId,
        epoch,
        data: { success: true, data: endpoints.data },
      })

      endpointIdsList.push({ modelId, endpointIds: endpoints.data.map((e) => e.id) })
    }

    await ctx.runMutation(internal.snapshots.insertSnapshot, {
      resourceType: 'endpoint-ids-list',
      epoch,
      data: { success: true, data: endpointIdsList },
    })

    await ctx.scheduler.runAfter(0, internal.sync.syncHourlyUptimes, { epoch })

    // Track completion
    const totalEndpoints = endpointIdsList.reduce((sum, item) => sum + item.endpointIds.length, 0)
    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'endpoints',
      epoch,
      event: 'completed',
      metadata: {
        itemCount: modelList.length,
        totalEndpoints,
      },
    })
  },
})

export const syncHourlyUptimes = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const endpointIdsList = await ctx.runQuery(internal.snapshots.getEpochEndpointIdsList, { epoch })

    for (const { modelId, endpointIds } of endpointIdsList) {
      const uptimeMap = new Map<string, unknown>()
      for (const endpointId of endpointIds) {
        const result = await openrouter.frontend.stats.uptimeHourly({ id: endpointId })
        uptimeMap.set(endpointId, result)
      }

      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'uptime-hourly',
        resourceId: modelId,
        epoch,
        data: { success: true, data: Object.fromEntries(uptimeMap) },
      })
    }

    // Track completion
    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'uptime-hourly',
      epoch,
      event: 'completed',
      metadata: { itemCount: endpointIdsList.length },
    })
  },
})

export const syncRecentUptimes = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const modelList = await ctx.runQuery(internal.snapshots.getEpochModelList, { epoch })

    for (const { modelId, permaslug } of modelList) {
      const result = await openrouter.frontend.stats.uptimeRecent({ permaslug })
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'uptime-recent',
        resourceId: modelId,
        epoch,
        data: result,
      })
    }

    // Track completion
    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'uptime-recent',
      epoch,
      event: 'completed',
      metadata: { itemCount: modelList.length },
    })
  },
})

export const syncApps = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const modelList = await ctx.runQuery(internal.snapshots.getEpochModelList, { epoch })

    for (const { modelId, permaslug, variant } of modelList) {
      const result = await openrouter.frontend.stats.app({ permaslug, variant })
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'apps',
        resourceId: modelId,
        epoch,
        data: result,
      })
    }

    // Track completion
    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'apps',
      epoch,
      event: 'completed',
      metadata: { itemCount: modelList.length },
    })
  },
})

export const syncModelAuthors = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const modelList = await ctx.runQuery(internal.snapshots.getEpochModelList, { epoch })

    const authorSlugs = new Set(modelList.map((m) => m.author))

    for (const authorSlug of authorSlugs) {
      const result = await openrouter.frontend.modelAuthor({
        authorSlug,
        shouldIncludeStats: true,
        shouldIncludeVariants: false,
      })

      if (!result.success) {
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          resourceType: 'model-author',
          resourceId: authorSlug,
          epoch,
          data: result,
        })
        continue
      }

      // * author data
      const authorsResult = z
        .object({
          author: z.record(z.string(), z.unknown()),
        })
        .safeParse(result.data)

      if (!authorsResult.success) {
        // we can't store the entire result on error because it's too big
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          resourceType: 'model-author',
          resourceId: authorSlug,
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
        continue
      } else {
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          resourceType: 'model-author',
          resourceId: authorSlug,
          epoch,
          data: { success: true, data: authorsResult.data },
        })
      }

      // * models with stats
      const modelsWithStatsResult = z
        .object({
          modelsWithStats: z
            .object({
              slug: z.string(),
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
          resourceType: 'model-author',
          resourceId: authorSlug,
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
        continue
      }

      for (const modelStats of modelsWithStatsResult.data.modelsWithStats) {
        const { stats, endpoint, slug } = modelStats

        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          resourceType: 'model-stats',
          resourceId: endpoint?.model_variant_slug ?? slug, // this is equivalent to modelId
          epoch,
          data: { success: true, data: stats },
        })
      }
    }

    // Track completion
    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'model-authors',
      epoch,
      event: 'completed',
      metadata: {
        itemCount: authorSlugs.size,
      },
    })
  },
})

function getHourlyEpoch(now: number = Date.now()) {
  const date = new Date(now)
  date.setMinutes(0, 0, 0)
  return date.getTime()
}

export const start = internalAction({
  handler: async (ctx) => {
    const epoch = getHourlyEpoch()

    await ctx.scheduler.runAfter(0, internal.sync.syncProviders, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.syncModels, { epoch })

    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'sync',
      epoch,
      event: 'started',
      metadata: { timestamp: Date.now() },
    })

    return { epoch }
  },
})
