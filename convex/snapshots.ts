import { v, type Infer } from 'convex/values'
import { internalMutation, internalQuery } from './_generated/server'

export const vModelList = v.array(
  v.object({
    modelId: v.string(),
    author: v.string(),
    params: v.object({ permaslug: v.string(), variant: v.string() }),
    topEndpointId: v.string(),
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
    category: v.string(),
    key: v.string(),
    epoch: v.number(),
    data: v.union(
      v.object({ success: v.literal(true), data: v.any() }),
      v.object({ success: v.literal(false), error: v.any() }),
    ),
  },
  handler: async (ctx, { category, key, epoch, data }) => {
    const stringified = JSON.stringify(data)
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stringified))

    const id = await ctx.db.insert('snapshots', {
      category,
      key,
      epoch,
      hash,
      data: stringified,
      size: stringified.length,
      success: data.success,
    })

    return id
  },
})

export const getEpochModelList = internalQuery({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const snapshot = await ctx.db
      .query('snapshots')
      .withIndex('by_category_key_epoch', (q) =>
        q.eq('category', 'model-list').eq('key', '').eq('epoch', epoch),
      )
      .first()
    if (!snapshot || typeof snapshot.data !== 'string') {
      return null
    }

    try {
      const { data } = JSON.parse(snapshot.data) as { data: Infer<typeof vModelList> }
      return data
    } catch (error) {
      console.error('Failed to parse model list', epoch, error)
      return null
    }
  },
})

export const getEpochEndpointIdsList = internalQuery({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const snapshot = await ctx.db
      .query('snapshots')
      .withIndex('by_category_key_epoch', (q) =>
        q.eq('category', 'endpoint-ids-list').eq('key', '').eq('epoch', epoch),
      )
      .first()
    if (!snapshot || typeof snapshot.data !== 'string') {
      return null
    }

    try {
      const { data } = JSON.parse(snapshot.data) as { data: Infer<typeof vEndpointIdsList> }
      return data
    } catch (error) {
      console.error('Failed to parse endpoint ids list', epoch, error)
      return null
    }
  },
})
