import { v } from 'convex/values'

import { internal } from '../../_generated/api'
import { internalMutation } from '../../_generated/server'

export const runPostCrawl = internalMutation({
  args: {
    crawl_id: v.string(),
  },
  handler: async (ctx, { crawl_id }) => {
    const prevCrawl = await ctx.db
      .query('snapshot_crawl_archives')
      .withIndex('by_crawl_id', (q) => q.lt('crawl_id', crawl_id))
      .order('desc')
      .first()

    if (prevCrawl) {
      await ctx.scheduler.runAfter(0, internal.snapshots.changes2.backfill.run, {
        fromCrawlId: prevCrawl.crawl_id,
      })
    } else {
      console.warn('[runPostCrawl] no previous crawl found', { crawl_id })
    }
  },
})
