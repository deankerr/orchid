import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { openrouter } from '../openrouter/client'
import { getEndpointIdsList } from './state'

export const hourlyUptimes = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const endpointIdsList = await getEndpointIdsList(ctx, { epoch })

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
    await ctx.runMutation(internal.sync.process.insertSyncStatus, {
      action: 'uptime-hourly',
      epoch,
      event: 'completed',
      metadata: { itemCount: endpointIdsList.length },
    })
  },
})
