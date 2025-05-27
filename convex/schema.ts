import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const schema = defineSchema({
  snapshots: defineTable({
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    epoch: v.number(),
    hash: v.bytes(),
    size: v.number(),
    data: v.union(v.string(), v.bytes()),
    success: v.boolean(),
  })
    .index('by_resourceType_resourceId_epoch', ['resourceType', 'resourceId', 'epoch'])
    .index('by_resourceType_epoch', ['resourceType', 'epoch']),

  meps: defineTable({
    model: v.record(v.string(), v.any()),
    endpoints: v.array(v.record(v.string(), v.any())),
  }),
})

export default schema
