import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, internalQuery } from '../../_generated/server'

// NOTE: this table is deprecated, to be remove after archive migration is complete

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

export const getFirstCrawlId = internalQuery({
  handler: async (ctx) => {
    const result = await ctx.db.query('snapshot_raw_archives').first()
    return result?.crawl_id
  },
})

export const getNextCrawlId = internalQuery({
  args: {
    afterCrawlId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all crawl IDs ordered by creation time
    const allCrawls = await ctx.db
      .query('snapshot_raw_archives')
      .withIndex('by_crawl_id', (q) => q.gt('crawl_id', args.afterCrawlId))
      .first()

    return allCrawls?.crawl_id
  },
})

// Simple batch loader for cleanup loop
export const getBatch = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.query('snapshot_raw_archives').take(args.limit)
  },
})

// Batch delete helper for cleanup loop
export const deleteMany = internalMutation({
  args: { ids: v.array(v.id('snapshot_raw_archives')) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id)
    }
  },
})
