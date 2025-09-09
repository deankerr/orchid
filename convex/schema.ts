import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

import { table as ORAppsTable } from './db/or/apps'
import { table as ORChangesTable } from './db/or/changes'
import { table as OREndpointsTable } from './db/or/endpoints'
import { table as ORModelAppLeaderboardsTable } from './db/or/modelAppLeaderboards'
import { table as ORModelDetailsTable } from './db/or/modelDetails'
import { table as ORModelsTable } from './db/or/models'
import { table as ORModelTokenStatsTable } from './db/or/modelTokenStats'
import { table as ORProvidersTable } from './db/or/providers'
import { table as ORViewsEndpointsTable } from './db/or/views/endpoints'
import { table as ORViewsModelsTable } from './db/or/views/models'
import { table as ORViewsProvidersTable } from './db/or/views/providers'
import { table as SnapshotCrawlArchivesTable } from './db/snapshot/crawlArchives'
import { table as SnapshotCrawlConfigTable } from './db/snapshot/crawlConfig'

export default defineSchema(
  {
    or_views_endpoints: ORViewsEndpointsTable,
    or_views_models: ORViewsModelsTable,
    or_views_providers: ORViewsProvidersTable,

    or_apps: ORAppsTable,
    or_changes: ORChangesTable,
    or_endpoints: OREndpointsTable,
    or_model_app_leaderboards: ORModelAppLeaderboardsTable,
    or_model_details: ORModelDetailsTable,
    or_model_token_stats: ORModelTokenStatsTable,
    or_models: ORModelsTable,
    or_providers: ORProvidersTable,

    snapshot_crawl_config: SnapshotCrawlConfigTable,
    snapshot_crawl_archives: SnapshotCrawlArchivesTable,

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
