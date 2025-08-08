import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, internalQuery } from '../../_generated/server'

export const table = defineTable({
  crawl_id: v.string(),
  path: v.string(), // path + search params
  storage_id: v.id('_storage'),
}).index('by_crawl_id', ['crawl_id'])

export const insert = internalMutation({
  args: {
    crawlId: v.string(),
    path: v.string(),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('snapshot_raw_archives', {
      crawl_id: args.crawlId,
      path: args.path,
      storage_id: args.storageId,
    })
  },
})

export const getByCrawlId = internalQuery({
  args: {
    crawlId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('snapshot_raw_archives')
      .withIndex('by_crawl_id', (q) => q.eq('crawl_id', args.crawlId))
      .collect()
  },
})
