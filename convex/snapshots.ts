import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { internalMutation, internalQuery } from './_generated/server'

export const insertSnapshot = internalMutation({
  args: {
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    epoch: v.number(),
    data: v.union(
      v.object({ success: v.boolean(), data: v.any() }),
      v.object({ success: v.boolean(), error: v.any() }),
    ),
  },
  returns: v.id('snapshots'),
  handler: async (ctx, { resourceType, resourceId, epoch, data }) => {
    const stringified = JSON.stringify(data)
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stringified))

    const id = await ctx.db.insert('snapshots', {
      resourceType,
      resourceId,
      epoch,
      hash,
      data: stringified,
      size: stringified.length,
      success: data.success,
    })

    // notice only, snapshot was still saved
    if (!data.success) {
      console.warn(`${resourceType}:${resourceId}`, (data as any)?.error)
    }

    return id
  },
})

export const get = internalQuery({
  args: {
    epoch: v.number(),
    resourceType: v.string(),
  },
  handler: async (ctx, { resourceType, epoch }) => {
    const snapshot = await ctx.db
      .query('snapshots')
      .withIndex('by_resourceType_epoch', (q) => q.eq('resourceType', resourceType).eq('epoch', epoch))
      .first()
    if (!snapshot) return null

    const data = readSnapshotData(snapshot)
    if (!data)
      throw new ConvexError({
        message: 'Failed to read snapshot data',
        epoch,
        resourceType,
        id: snapshot._id,
      })

    return {
      ...snapshot,
      data,
    }
  },
})

export const getWithResourceId = internalQuery({
  args: {
    epoch: v.number(),
    resourceType: v.string(),
    resourceId: v.string(),
  },
  handler: async (ctx, { resourceType, resourceId, epoch }) => {
    const snapshot = await ctx.db
      .query('snapshots')
      .withIndex('by_resourceType_resourceId_epoch', (q) =>
        q.eq('resourceType', resourceType).eq('resourceId', resourceId).eq('epoch', epoch),
      )
      .first()
    if (!snapshot) return null

    const data = readSnapshotData(snapshot)
    if (!data)
      throw new ConvexError({
        message: 'Failed to read snapshot data',
        epoch,
        resourceType,
        resourceId,
        id: snapshot._id,
      })

    return {
      ...snapshot,
      data,
      resourceId: snapshot.resourceId!,
    }
  },
})

export const getByResourceTypeResourceIdEpoch = internalQuery({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
    epoch: v.number(),
  },
  handler: async (ctx, { resourceType, resourceId, epoch }) => {
    const snapshot = await ctx.db
      .query('snapshots')
      .withIndex('by_resourceType_resourceId_epoch', (q) =>
        q.eq('resourceType', resourceType).eq('resourceId', resourceId).eq('epoch', epoch),
      )
      .first()

    return snapshot
  },
})

export function readSnapshotData(snapshot: Doc<'snapshots'>) {
  if (typeof snapshot.data !== 'string') {
    // decompress here when we start archiving snapshots
    return null
  }

  return JSON.parse(snapshot.data) as
    | { success: boolean; data: unknown }
    | { success: boolean; error: unknown }
}
