import { ConvexError, v, type Infer } from 'convex/values'
import { internalMutation, internalQuery, type QueryCtx } from './_generated/server'

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
  handler: async (ctx, args) => {
    // 0 = get latest epoch (dev helper)
    const epoch = args.epoch || (await getLatestSyncEpoch(ctx))

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

async function getLatestSyncEpoch(ctx: QueryCtx) {
  const snapshot = await ctx.db
    .query('snapshots')
    .withIndex('by_resourceType_epoch', (q) => q.eq('resourceType', 'sync-status'))
    .order('desc')
    .first()
  if (!snapshot) return 0
  return snapshot.epoch
}
