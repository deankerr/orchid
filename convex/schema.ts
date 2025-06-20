import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { Files } from './files'
import { OrModels } from './or/or_models'
import { OrApps } from './or/or_apps'
import { OrAuthors } from './or/or_authors'
import { OrEndpoints } from './or/or_endpoints'
import { OrProviders } from './or/or_providers'
import { OrAppTokenMetrics } from './or/or_app_token_metrics'
import { OrEndpointMetrics } from './or/or_endpoint_metrics'
import { OrEndpointUptimeMetrics } from './or/or_endpoint_uptime_metrics'
import { OrModelTokenMetrics } from './or/or_model_token_metrics'

export const schema = defineSchema(
  {
    files_v2: Files.table.index('by_key', ['key']),

    or_apps: OrApps.table.index('by_app_id', ['app_id']),
    or_authors: OrAuthors.table.index('by_uuid', ['uuid']),
    or_endpoints: OrEndpoints.table.index('by_uuid', ['uuid']),
    or_models: OrModels.table.index('by_slug', ['slug']),
    or_providers: OrProviders.table.index('by_slug', ['slug']),

    or_app_token_metrics: OrAppTokenMetrics.table.index('by_app_id_snapshot_at', ['app_id', 'snapshot_at']),
    or_endpoint_metrics: OrEndpointMetrics.table.index('by_endpoint_uuid_snapshot_at', [
      'endpoint_uuid',
      'snapshot_at',
    ]),
    or_endpoint_uptime_metrics: OrEndpointUptimeMetrics.table.index('by_endpoint_uuid_timestamp', [
      'endpoint_uuid',
      'timestamp',
    ]),
    or_model_token_metrics: OrModelTokenMetrics.table.index('by_model_permaslug_model_variant_timestamp', [
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
