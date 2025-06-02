import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { internalMutation, internalQuery } from './_generated/server'

export type SnapshotWithData = Omit<Doc<'snapshots'>, 'data'> & { data: unknown }

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
    resourceId: v.optional(v.string()),
  },
  handler: async (ctx, { epoch, resourceType, resourceId }) => {
    const snapshot = resourceId
      ? await ctx.db
          .query('snapshots')
          .withIndex('by_epoch_resourceType_resourceId', (q) =>
            q.eq('epoch', epoch).eq('resourceType', resourceType).eq('resourceId', resourceId),
          )
          .first()
      : await ctx.db
          .query('snapshots')
          .withIndex('by_epoch_resourceType_resourceId', (q) =>
            q.eq('epoch', epoch).eq('resourceType', resourceType),
          )
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

export function readSnapshotData(snapshot: Doc<'snapshots'>) {
  if (typeof snapshot.data !== 'string') {
    // decompress here when we start archiving snapshots
    return null
  }

  return JSON.parse(snapshot.data) as
    | { success: boolean; data: unknown }
    | { success: boolean; error: unknown }
}
