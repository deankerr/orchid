import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { appTokensTable, appsTable } from './sync_v1/apps_v1'
import { authorsTable } from './sync_v1/authors_v1'
import { endpointStatsTable } from './sync_v1/endpoint_stats_v1'
import { endpointUptimeTable } from './sync_v1/endpoint_uptime_v1'
import { endpointsTable } from './sync_v1/endpoints_v1'
import { modelTokensTable } from './sync_v1/model_tokens_v1'
import { modelsTable } from './sync_v1/models_v1'

export const schema = defineSchema(
  {
    models_v1: modelsTable,
    endpoints_v1: endpointsTable,
    endpoint_stats_v1: endpointStatsTable,
    endpoint_uptime_v1: endpointUptimeTable,
    apps_v1: appsTable,
    app_tokens_v1: appTokensTable,
    model_tokens_v1: modelTokensTable,
    authors_v1: authorsTable,

    // version 0 archived data
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
  },
  {
    strictTableNameTypes: false,
  },
)

export default schema
