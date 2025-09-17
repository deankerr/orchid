import { defineSchema } from 'convex/server'

import { db } from './db'

export default defineSchema(
  {
    or_views_endpoints: db.or.views.endpoints.table,
    or_views_models: db.or.views.models.table,
    or_views_providers: db.or.views.providers.table,

    or_changes: db.or.changes.table,

    snapshot_crawl_config: db.snapshot.crawl.config.table,
    snapshot_crawl_archives: db.snapshot.crawl.archives.table,
  },
  {
    strictTableNameTypes: true,
  },
)
