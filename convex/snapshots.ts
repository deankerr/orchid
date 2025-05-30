import { ConvexError, v, type Infer } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { internalMutation, internalQuery } from './_generated/server'

export const vModelList = v.array(
  v.object({
    modelId: v.string(),
    author: v.string(),
    slug: v.string(),
    permaslug: v.string(),
    variant: v.optional(v.string()),
    topEndpointId: v.optional(v.string()),
  }),
)

export const vEndpointIdsList = v.array(
  v.object({
    modelId: v.string(),
    endpointIds: v.array(v.string()),
  }),
)

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

    if (!data.success) {
      console.error(`${resourceType}:${resourceId}`, (data as any)?.error)
    }

    return id
  },
})

export const getEpochModelList = internalQuery({
  args: {
    epoch: v.number(),
  },
  returns: vModelList,
  handler: async (ctx, { epoch }) => {
    const snapshot = await ctx.db
      .query('snapshots')
      .withIndex('by_resourceType_epoch', (q) => q.eq('resourceType', 'model-list').eq('epoch', epoch))
      .first()

    if (!snapshot || typeof snapshot.data !== 'string') {
      throw new ConvexError({ message: 'Failed to get model list', epoch })
    }

    try {
      const { data } = JSON.parse(snapshot.data) as { data: Infer<typeof vModelList> }
      return data
    } catch {
      throw new ConvexError({ message: 'Failed to parse model list', epoch })
    }
  },
})

export const getEpochEndpointIdsList = internalQuery({
  args: {
    epoch: v.number(),
  },
  returns: vEndpointIdsList,
  handler: async (ctx, { epoch }) => {
    const snapshot = await ctx.db
      .query('snapshots')
      .withIndex('by_resourceType_epoch', (q) => q.eq('resourceType', 'endpoint-ids-list').eq('epoch', epoch))
      .first()

    if (!snapshot || typeof snapshot.data !== 'string') {
      throw new ConvexError({ message: 'Failed to get endpoint ids list', epoch })
    }

    try {
      const { data } = JSON.parse(snapshot.data) as { data: Infer<typeof vEndpointIdsList> }
      return data
    } catch {
      throw new ConvexError({ message: 'Failed to parse endpoint ids list', epoch })
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

export const insertSyncStatus = internalMutation({
  args: {
    action: v.string(),
    epoch: v.number(),
    event: v.string(), // 'completed', 'started', 'failed', etc.
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { action, epoch, event, metadata = {} }) => {
    const stringified = JSON.stringify({
      success: true,
      data: {
        event,
        timestamp: Date.now(),
        ...metadata,
      },
    })
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stringified))

    return await ctx.db.insert('snapshots', {
      resourceType: 'sync-status',
      resourceId: action,
      epoch,
      hash,
      data: stringified,
      size: stringified.length,
      success: true,
    })
  },
})

export const getSyncStatus = internalQuery({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const snapshots = await ctx.db
      .query('snapshots')
      .withIndex('by_resourceType_epoch', (q) => q.eq('resourceType', 'sync-status').eq('epoch', epoch))
      .collect()

    return snapshots
      .map((snapshot) => {
        try {
          const { data } = JSON.parse(snapshot.data as string) as { data: any }
          return { action: snapshot.resourceId, ...data }
        } catch (error) {
          console.error('Failed to parse sync status', epoch, snapshot.resourceId, error)
          return null
        }
      })
      .filter(Boolean)
  },
})

export const getRecentSyncStatuses = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 50 }) => {
    const snapshots = await ctx.db
      .query('snapshots')
      .withIndex('by_resourceType_epoch', (q) => q.eq('resourceType', 'sync-status'))
      .order('desc')
      .take(limit)

    // Group by epoch
    const epochGroups = new Map<
      number,
      {
        action: string
        status?: string
        timestamp?: number
        metadata?: any
      }[]
    >()

    for (const snapshot of snapshots) {
      if (!snapshot.resourceId) continue

      const epochGroup = epochGroups.get(snapshot.epoch) ?? []
      epochGroups.set(snapshot.epoch, epochGroup)

      const data = readSnapshotData(snapshot) as {
        data: { event: string; timestamp: number; metadata: any }
      } | null

      epochGroup.push({
        action: snapshot.resourceId,
        status: data?.data.event,
        timestamp: data?.data.timestamp,
        metadata: data?.data.metadata,
      })
    }

    return [...epochGroups]
      .map(([epoch, items]) => ({
        epoch,
        items,
      }))
      .sort((a, b) => b.epoch - a.epoch)
  },
})

export const explore = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    const snapshots = await ctx.db
      .query('snapshots')
      .withIndex('by_resourceType_epoch', (q) => q.eq('resourceType', 'model'))
      .order('desc')
      .take(limit)

    const groupMap = new Map<string, string[]>()
    const modelVersionGroupIdMap = new Map<string, string[]>()

    for (const snapshot of snapshots) {
      const data = readSnapshotData(snapshot) as { data: any }
      if (!data) continue

      if (data.data.group) {
        groupMap.set(data.data.group, [...(groupMap.get(data.data.group) ?? []), snapshot.resourceId!])
      }

      if (data.data.model_version_group_id) {
        modelVersionGroupIdMap.set(data.data.model_version_group_id, [
          ...(modelVersionGroupIdMap.get(data.data.model_version_group_id) ?? []),
          snapshot.resourceId!,
        ])
      }
    }

    return {
      groupMap: [...groupMap.entries()],
      modelVersionGroupIdMap: [...modelVersionGroupIdMap.entries()],
    }
  },
})

export function readSnapshotData(snapshot: Doc<'snapshots'>) {
  if (typeof snapshot.data !== 'string') {
    return null
  }

  try {
    return JSON.parse(snapshot.data) as unknown
  } catch {
    return null
  }
}
