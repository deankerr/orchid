import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { openrouter } from '../openrouter/client'

export const apps = internalAction({
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
