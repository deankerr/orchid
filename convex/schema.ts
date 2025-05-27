import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const schema = defineSchema({
  snapshots: defineTable({
    category: v.string(),
    key: v.string(),
    epoch: v.number(),
    hash: v.bytes(),
    size: v.number(),
    data: v.union(v.string(), v.bytes()),
    success: v.boolean(),
  })
    .index('by_category_key_epoch', ['category', 'key', 'epoch'])
    .index('by_category_epoch', ['category', 'epoch']),

  snapshots_old: defineTable({
    category: v.string(),
    key: v.string(),
    batchTimestamp: v.number(), // Timestamp linking related snapshot items together
    hash: v.bytes(),
    data: v.bytes(),
    size: v.number(),
  })
    .index('by_hash', ['hash'])
    .index('by_category', ['category'])
    .index('by_batchTimestamp', ['batchTimestamp']),

  meps: defineTable({
    model: v.record(v.string(), v.any()),
    endpoints: v.array(v.record(v.string(), v.any())),
  }),
})

export default schema
