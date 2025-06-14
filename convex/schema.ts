import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { ModelViews } from './model_views/table'
import { Files } from './files'
import { appTokensTable, appsTable } from './sync_v1/apps_v1'
import { authorsTable } from './sync_v1/authors_v1'
import { endpointStatsTable } from './sync_v1/endpoint_stats_v1'
import { endpointUptimeTable } from './sync_v1/endpoint_uptime_v1'
import { endpointsTable } from './sync_v1/endpoints_v1'
import { modelTokensTable } from './sync_v1/model_tokens_v1'
import { modelsTable } from './sync_v1/models_v1'
import { EndpointViews } from './endpoint_views/table'
import { EndpointStats } from './endpoint_stats/table'
import { AppViews } from './app_views/table'
import { AuthorViews } from './author_views/table'
import { EndpointUptimeStats } from './endpoint_uptime_stats/table'
import { ModelTokenStats } from './model_token_stats/table'
import { AppTokenStats } from './app_token_stats/table'

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

    files_v1: Files.table,

    model_views: ModelViews.table.index('by_slug', ['slug']),
    endpoint_views: EndpointViews.table.index('by_uuid', ['uuid']),
    author_views: AuthorViews.table.index('by_slug', ['slug']),
    endpoint_stats: EndpointStats.table.index('by_endpoint_uuid_epoch', ['endpoint_uuid', 'epoch']),
    app_views: AppViews.table.index('by_app_id', ['app_id']),
    app_token_stats: AppTokenStats.table.index('by_app_id_epoch', ['app_id', 'epoch']),
    endpoint_uptime_stats: EndpointUptimeStats.table.index('by_endpoint_uuid_timestamp', [
      'endpoint_uuid',
      'timestamp',
    ]),
    model_token_stats: ModelTokenStats.table.index('by_model_permaslug_model_variant_timestamp', [
      'model_permaslug',
      'model_variant',
      'timestamp',
    ]),

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
