import { paginationOptsValidator } from 'convex/server'

import type { Doc } from '../_generated/dataModel'
import { query } from '../_generated/server'

export type EndpointChangeDoc = Extract<Doc<'or_views_changes'>, { entity_type: 'endpoint' }>

export const feedTreeItems = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { paginationOpts }) => {
    const results = await ctx.db
      .query('or_views_changes')
      .withIndex('by_entity_type__crawl_id', (q) => q.eq('entity_type', 'endpoint'))
      .order('desc')
      .paginate(paginationOpts)

    return {
      ...results,
      page: results.page.filter((item) => item.entity_type === 'endpoint'),
    }
  },
})
