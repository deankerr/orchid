import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const schema = defineSchema({
  snapshots: defineTable({
    resourceType: v.string(), // 'models', 'endpoints', 'uptime-recent', 'providers', etc.
    resourceId: v.optional(v.string()), // modelId, authorSlug, action, or '' for global resources
    epoch: v.number(),
    hash: v.bytes(),
    size: v.number(),
    data: v.union(v.string(), v.bytes()),
    success: v.boolean(),
  })
    .index('by_resourceType_resourceId_epoch', ['resourceType', 'resourceId', 'epoch'])
    .index('by_resourceType_epoch', ['resourceType', 'epoch']),

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
