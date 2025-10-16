import * as or_changes from './or/changes'
import * as or_stats from './or/stats'
import * as or_views_changes from './or/views/changes'
import * as or_views_endpoints from './or/views/endpoints'
import * as or_views_models from './or/views/models'
import * as or_views_providers from './or/views/providers'
import * as snapshot_crawl_archives from './snapshot/crawl/archives'
import * as snapshot_crawl_config from './snapshot/crawl/config'

export const db = {
  or: {
    changes: or_changes,
    stats: or_stats,
    views: {
      changes: or_views_changes,
      endpoints: or_views_endpoints,
      models: or_views_models,
      providers: or_views_providers,
    },
  },
  snapshot: {
    crawl: {
      config: snapshot_crawl_config,
      archives: snapshot_crawl_archives,
    },
  },
}
