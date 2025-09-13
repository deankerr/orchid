import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

import { table as ORChangesTable } from './db/or/changes'
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

    or_changes: ORChangesTable,

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
