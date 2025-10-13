import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { diff } from 'json-diff-ts'

import { internalMutation, internalQuery, query } from '../../../_generated/server'
import { createTableVHelper } from '../../../lib/vTable'

const entityTypeValidator = v.union(
  v.literal('model'),
  v.literal('endpoint'),
  v.literal('provider'),
)

const changeKindValidator = v.union(v.literal('create'), v.literal('update'), v.literal('delete'))

export const table = defineTable({
  crawl_id: v.string(),
  previous_crawl_id: v.string(),

  entity_type: entityTypeValidator,
  change_kind: changeKindValidator,

  model_slug: v.optional(v.string()), // model, endpoint
  provider_slug: v.optional(v.string()), // provider, endpoint
  provider_tag_slug: v.optional(v.string()), // endpoint
  endpoint_uuid: v.optional(v.string()), // endpoint

  path: v.optional(v.string()),
  path_level_1: v.optional(v.string()),
  path_level_2: v.optional(v.string()),

  before: v.optional(v.any()),
  after: v.optional(v.any()),
})
  .index('by_previous_crawl_id__crawl_id', ['previous_crawl_id', 'crawl_id'])
  .index('by_crawl_id', ['crawl_id'])

export const vTable = createTableVHelper('or_views_changes', table.validator)

export type OrViewsChangeDoc = typeof vTable.doc.type
export type OrViewsChangeFields = typeof vTable.validator.type

export const replacePairChanges = internalMutation({
  args: {
    previous_crawl_id: v.string(),
    crawl_id: v.string(),
    changes: v.array(vTable.validator),
  },
  returns: v.object({
    insert: v.number(),
    update: v.number(),
    delete: v.number(),
    stable: v.number(),
  }),
  handler: async (ctx, args) => {
    // * for identifying the same change subject
    function changeKey(change: OrViewsChangeFields) {
      return [
        change.entity_type,
        change.change_kind,
        change.model_slug ?? '',
        change.provider_slug ?? '',
        change.provider_tag_slug ?? '',
        change.endpoint_uuid ?? '',
        change.path ?? '',
      ].join('|')
    }

    const existing = await ctx.db
      .query(vTable.name)
      .withIndex('by_previous_crawl_id__crawl_id', (q) =>
        q.eq('previous_crawl_id', args.previous_crawl_id).eq('crawl_id', args.crawl_id),
      )
      .collect()

    const counters = {
      insert: 0,
      update: 0,
      delete: 0,
      stable: 0,
    }

    const existingByKey = new Map<string, OrViewsChangeDoc>()

    for (const doc of existing) {
      const key = changeKey(doc)
      existingByKey.set(key, doc)
    }

    for (const change of args.changes) {
      if (
        change.previous_crawl_id !== args.previous_crawl_id ||
        change.crawl_id !== args.crawl_id
      ) {
        throw new Error('Change pair mismatch in replacePair mutation')
      }

      const key = changeKey(change)
      const current = existingByKey.get(key)

      if (!current) {
        await ctx.db.insert(vTable.name, change)
        counters.insert++
        continue
      }

      const diffResults = diff(current, change, {
        keysToSkip: ['_id', '_creationTime'],
      })

      if (!diffResults.length) {
        counters.stable++
      } else {
        await ctx.db.replace(current._id, change)
        counters.update++
      }

      existingByKey.delete(key)
    }

    for (const leftover of existingByKey.values()) {
      await ctx.db.delete(leftover._id)
      counters.delete++
    }

    console.log('[or_views_changes:replacePair]', {
      previous_crawl_id: args.previous_crawl_id,
      crawl_id: args.crawl_id,
      ...counters,
    })

    return counters
  },
})

export const listPairChanges = query({
  args: {
    previous_crawl_id: v.string(),
    crawl_id: v.string(),
  },
  returns: v.array(vTable.doc),
  handler: async (ctx, args) => {
    return await ctx.db
      .query(vTable.name)
      .withIndex('by_previous_crawl_id__crawl_id', (q) =>
        q.eq('previous_crawl_id', args.previous_crawl_id).eq('crawl_id', args.crawl_id),
      )
      .collect()
  },
})

export const getLatestCrawlId = internalQuery({
  args: {},
  returns: v.union(v.null(), v.string()),
  handler: async (ctx) => {
    const doc = await ctx.db.query(vTable.name).withIndex('by_crawl_id').order('desc').first()
    return doc?.crawl_id ?? null
  },
})

export const dev_collect = query({
  handler: async (ctx) => {
    return await ctx.db.query(vTable.name).withIndex('by_crawl_id').order('desc').collect()
  },
})
