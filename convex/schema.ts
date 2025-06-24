import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

import { SnapshotArchives } from './openrouter/archives'
import { SnapshotConfig } from './openrouter/snapshot'
import { OrAppTokenMetrics } from './or/or_app_token_metrics'
import { OrApps, OrAppsChanges } from './or/or_apps'
import { OrAuthors, OrAuthorsChanges } from './or/or_authors'
import { OrEndpointMetrics } from './or/or_endpoint_metrics'
import { OrEndpointUptimeMetrics } from './or/or_endpoint_uptime_metrics'
import { OrEndpoints, OrEndpointsChanges } from './or/or_endpoints'
import { OrModelTokenMetrics } from './or/or_model_token_metrics'
import { OrModels, OrModelsChanges } from './or/or_models'
import { OrProviders, OrProvidersChanges } from './or/or_providers'

export const schema = defineSchema(
  {
    or_app_token_metrics: OrAppTokenMetrics.table
      .index('by_app_id_snapshot_at', ['app_id', 'snapshot_at'])
      .index('by_model_slug_variant_snapshot_at', ['model_slug', 'model_variant', 'snapshot_at'])
      .index('by_model_permaslug_variant_snapshot_at', [
        'model_permaslug',
        'model_variant',
        'snapshot_at',
      ])
      .index('by_snapshot_at', ['snapshot_at']),

    or_apps: OrApps.table.index('by_app_id', ['app_id']),
    or_apps_changes: OrAppsChanges.table,

    or_authors: OrAuthors.table.index('by_uuid', ['uuid']),
    or_authors_changes: OrAuthorsChanges.table,

    or_endpoint_metrics: OrEndpointMetrics.table.index('by_endpoint_uuid_snapshot_at', [
      'endpoint_uuid',
      'snapshot_at',
    ]),
    or_endpoint_uptime_metrics: OrEndpointUptimeMetrics.table.index('by_endpoint_uuid_timestamp', [
      'endpoint_uuid',
      'timestamp',
    ]),

    or_endpoints: OrEndpoints.table
      .index('by_uuid', ['uuid'])
      .index('by_model_slug', ['model_slug']),
    or_endpoints_changes: OrEndpointsChanges.table,

    or_model_token_metrics: OrModelTokenMetrics.table
      .index('by_model_permaslug_model_variant_timestamp', [
        'model_permaslug',
        'model_variant',
        'timestamp',
      ])
      .index('by_timestamp', ['timestamp']),

    or_models: OrModels.table.index('by_slug', ['slug']),
    or_models_changes: OrModelsChanges.table,

    or_providers: OrProviders.table.index('by_slug', ['slug']),
    or_providers_changes: OrProvidersChanges.table,

    snapshot_config: SnapshotConfig.table,
    snapshot_archives: SnapshotArchives.table.index('by_snapshot_at', ['snapshot_at']),

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
    strictTableNameTypes: true,
  },
)

export default schema
