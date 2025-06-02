import { v } from 'convex/values'
import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import { internalAction, internalMutation } from '../_generated/server'
import { getEpoch } from '../shared'

export const start = internalAction({
  handler: async (ctx) => {
    const epoch = getEpoch()

    await ctx.scheduler.runAfter(0, internal.sync.providers.providers, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.models.models, { epoch })

    await ctx.runMutation(internal.sync.process.insertSyncStatus, {
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

    await ctx.runMutation(internal.sync.process.insertSyncStatus, {
      action: 'sync',
      epoch,
      event: 'started',
      metadata: {},
    })

    return { epoch }
  },
})

export const insertSyncStatus = internalMutation({
  args: {
    action: v.string(),
    epoch: v.number(),
    event: v.string(), // 'completed', 'started', 'failed', etc.
    metadata: v.optional(v.any()),
  },
  returns: v.id('snapshots'),
  handler: async (ctx, { action, epoch, event, metadata = {} }) => {
    const id: Id<'snapshots'> = await ctx.runMutation(internal.snapshots.insertSnapshot, {
      resourceType: 'sync-status',
      resourceId: action,
      epoch,
      data: {
        success: true,
        data: { event, ...metadata },
      },
    })
    return id
  },
})
