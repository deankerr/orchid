import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

import * as ORApps from './db/or/apps'
import * as ORAuthors from './db/or/authors'
import * as OREndpoints from './db/or/endpoints'
import * as OREndpointStats from './db/or/endpointStats'
import * as OREndpointUptimes from './db/or/endpointUptimes'
import * as ORModelAppLeaderboards from './db/or/modelAppLeaderboards'
import * as ORModels from './db/or/models'
import * as ORModelTokenStats from './db/or/modelTokenStats'
import * as ORProviders from './db/or/providers'
import * as SnapshotArchives from './db/snapshot/archives'
import * as SnapshotCrawlConfig from './db/snapshot/crawlConfig'
import * as SnapshotRawArchives from './db/snapshot/rawArchives'
import * as SnapshotRuns from './db/snapshot/runs'
import * as SnapshotSchedule from './db/snapshot/schedule'

export const schema = defineSchema(
  {
    or_apps: ORApps.table,
    or_apps_changes: ORApps.changesTable,

    or_authors: ORAuthors.table,
    or_authors_changes: ORAuthors.changesTable,

    or_endpoint_stats: OREndpointStats.table,

    or_endpoints: OREndpoints.table,
    or_endpoints_changes: OREndpoints.changesTable,

    or_endpoint_uptimes: OREndpointUptimes.table,

    or_model_app_leaderboards: ORModelAppLeaderboards.table,

    or_model_token_stats: ORModelTokenStats.table,

    or_models: ORModels.table,
    or_models_changes: ORModels.changesTable,

    or_providers: ORProviders.table,
    or_providers_changes: ORProviders.changesTable,

    snapshot_crawl_config: SnapshotCrawlConfig.table,
    snapshot_archives: SnapshotArchives.table,
    snapshot_raw_archives: SnapshotRawArchives.table,
    snapshot_runs: SnapshotRuns.table,
    snapshot_schedule: SnapshotSchedule.table,

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
