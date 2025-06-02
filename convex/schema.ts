import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { vModel } from './projections/models'
import { vEndpoint } from './projections/endpoints'

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
    .index('by_epoch_resourceType_resourceId', ['epoch', 'resourceType', 'resourceId']),

  models: defineTable(vModel).index('by_slug', ['slug']),
  endpoints: defineTable(vEndpoint).index('by_uuid', ['uuid']),
})

export default schema
