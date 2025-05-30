import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { openrouter } from '../openrouter/client'

export const recentUptimes = internalAction({
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
