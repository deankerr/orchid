import { v } from 'convex/values'
import { z } from 'zod'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { openrouter } from '../openrouter/client'

export const endpoints = internalAction({
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

    await ctx.scheduler.runAfter(0, internal.sync.hourlyUptimes.hourlyUptimes, { epoch })

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
