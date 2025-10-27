import { stream } from 'convex-helpers/server/stream'
import { paginationOptsValidator } from 'convex/server'

import type { Doc } from './_generated/dataModel'
import { query } from './_generated/server'
import schema from './schema'

export type EndpointChange = Extract<Doc<'or_views_changes'>, { entity_type: 'endpoint' }>

export const changesByCrawlId = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // * Get distinct crawl_id values with pagination
    return stream(ctx.db, schema)
      .query('or_views_changes')
      .withIndex('by_crawl_id')
      .order('desc')
      .distinct(['crawl_id'])
      .map(async (p) => {
        const batch = await ctx.db
          .query('or_views_changes')
          .withIndex('by_crawl_id', (q) => q.eq('crawl_id', p.crawl_id))
          .order('desc')
          .collect()

        return batch
          .filter((b) => b.entity_type === 'endpoint')
          .filter((b) => b.path !== 'provider.icon_url')
      })
      .paginate(args.paginationOpts)
  },
})
