import { nullable } from 'convex-helpers/validators'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, internalQuery } from '../../_generated/server'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  crawl_id: v.string(),
  storage_id: v.id('_storage'),
  data: v.record(v.string(), v.any()),
}).index('by_crawl_id', ['crawl_id'])

export const vTable = createTableVHelper('snapshot_crawl_archives', table.validator)

export const insert = internalMutation({
  args: {
    crawl_id: v.string(),
    storage_id: v.id('_storage'),
    data: v.record(v.string(), v.any()),
  },
  returns: vTable._id,
  handler: async (ctx, args) => {
    return await ctx.db.insert('snapshot_crawl_archives', args)
  },
})

export const getByCrawlId = internalQuery({
  args: {
    crawl_id: v.string(),
  },
  returns: vTable.doc.nullable(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('snapshot_crawl_archives')
      .withIndex('by_crawl_id', (q) => q.eq('crawl_id', args.crawl_id))
      .first()
  },
})

export const getLatestCrawlId = internalQuery({
  returns: nullable(v.string()),
  handler: async (ctx) => {
    return await ctx.db
      .query('snapshot_crawl_archives')
      .withIndex('by_crawl_id')
      .order('desc')
      .first()
      .then((r) => r?.crawl_id)
  },
})
