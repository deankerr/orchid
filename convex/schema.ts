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
import * as SnapshotCrawlArchives from './db/snapshot/crawlArchives'
import * as SnapshotCrawlConfig from './db/snapshot/crawlConfig'
import * as SnapshotRawArchives from './db/snapshot/rawArchives'

export const schema = defineSchema(
  {
    or_apps: ORApps.table,
    or_authors: ORAuthors.table,
    or_endpoint_stats: OREndpointStats.table,
    or_endpoints: OREndpoints.table,
    or_endpoint_uptimes: OREndpointUptimes.table,
    or_model_app_leaderboards: ORModelAppLeaderboards.table,
    or_model_token_stats: ORModelTokenStats.table,
    or_models: ORModels.table,
    or_providers: ORProviders.table,

    snapshot_crawl_config: SnapshotCrawlConfig.table,
    snapshot_crawl_archives: SnapshotCrawlArchives.table,
    snapshot_raw_archives: SnapshotRawArchives.table,

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
