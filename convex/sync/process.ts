import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'

function getHourlyEpoch(now: number = Date.now()) {
  const date = new Date(now)
  date.setMinutes(0, 0, 0)
  return date.getTime()
}

export const start = internalAction({
  handler: async (ctx) => {
    const epoch = getHourlyEpoch()

    await ctx.scheduler.runAfter(0, internal.sync.providers.providers, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.models.models, { epoch })

    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'sync',
      epoch,
      event: 'started',
      metadata: { timestamp: Date.now() },
    })

    return { epoch }
  },
})

export const startWithCustomEpoch = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, args) => {
    const epoch = args.epoch || Date.now()

    await ctx.scheduler.runAfter(0, internal.sync.providers.providers, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.models.models, { epoch })

    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'sync',
      epoch,
      event: 'started',
      metadata: { timestamp: Date.now() },
    })

    return { epoch }
  },
})
