import { nullable } from 'convex-helpers/validators'
import { defineTable, paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

import { internal } from '../../_generated/api'
import type { Id } from '../../_generated/dataModel'
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

export const collect = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query('snapshot_crawl_archives').collect()
  },
})

export const getAllByCrawlId = internalQuery({
  args: {
    crawl_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('snapshot_crawl_archives')
      .withIndex('by_crawl_id', (q) => q.eq('crawl_id', args.crawl_id))
      .collect()
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

export const list = internalQuery({
  args: { paginationOpts: paginationOptsValidator, fromCrawlId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('snapshot_crawl_archives')
      .withIndex('by_crawl_id', (q) => q.gte('crawl_id', args.fromCrawlId ?? ''))
      .paginate(args.paginationOpts)
  },
})

export const deleteByCrawlId = internalMutation({
  args: {
    crawl_ids: v.array(v.string()),
  },
  handler: async (ctx, { crawl_ids }) => {
    const storageIds: Id<'_storage'>[] = []

    for (const crawl_id of crawl_ids) {
      const crawlArchive = await ctx.db
        .query('snapshot_crawl_archives')
        .withIndex('by_crawl_id', (q) => q.eq('crawl_id', crawl_id))
        .first()
      if (crawlArchive) {
        await ctx.db.delete(crawlArchive._id)
        storageIds.push(crawlArchive.storage_id)
      }
    }

    await ctx.scheduler.runAfter(0, internal.storage.deleteFiles, {
      storageIds,
    })
  },
})
