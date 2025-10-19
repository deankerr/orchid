import { withSystemFields } from 'convex-helpers/validators'
import { defineTable } from 'convex/server'
import { Infer, v } from 'convex/values'

import { diff } from 'json-diff-ts'

import { Doc } from '../../../_generated/dataModel'
import { internalMutation, internalQuery, query } from '../../../_generated/server'

const changeKindValidator = v.union(v.literal('create'), v.literal('update'), v.literal('delete'))

const baseFields = {
  crawl_id: v.string(),
  previous_crawl_id: v.string(),

  change_kind: changeKindValidator,

  path: v.optional(v.string()),
  path_level_1: v.optional(v.string()),
  path_level_2: v.optional(v.string()),

  before: v.optional(v.any()),
  after: v.optional(v.any()),
}

const modelChangesValidator = v.object({
  entity_type: v.literal('model'),
  model_slug: v.string(),
  ...baseFields,
})

const endpointChangesValidator = v.object({
  entity_type: v.literal('endpoint'),
  model_slug: v.string(), // model, endpoint
  provider_slug: v.string(), // provider, endpoint
  provider_tag_slug: v.string(), // endpoint
  endpoint_uuid: v.string(), // endpoint
  ...baseFields,
})

const providerChangesValidator = v.object({
  entity_type: v.literal('provider'),
  provider_slug: v.string(),
  ...baseFields,
})

export const table = defineTable(
  v.union(modelChangesValidator, providerChangesValidator, endpointChangesValidator),
)
  .index('by_previous_crawl_id__crawl_id', ['previous_crawl_id', 'crawl_id'])
  .index('by_crawl_id', ['crawl_id'])

// NOTE: we can't create this with a union validator
// export const vTable = createTableVHelper('or_views_changes', table.validator)

export type OrViewsChangeDoc = Doc<'or_views_changes'>
export type OrViewsChangeFields = Infer<typeof table.validator>

const tableName = 'or_views_changes'
const unionDocValidator = v.union(
  v.object(withSystemFields(tableName, modelChangesValidator.fields)),
  v.object(withSystemFields(tableName, providerChangesValidator.fields)),
  v.object(withSystemFields(tableName, endpointChangesValidator.fields)),
)

export const replacePairChanges = internalMutation({
  args: {
    previous_crawl_id: v.string(),
    crawl_id: v.string(),
    changes: v.array(table.validator),
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
        (change as any).model_slug ?? '',
        (change as any).provider_slug ?? '',
        (change as any).provider_tag_slug ?? '',
        (change as any).endpoint_uuid ?? '',
        change.path ?? '',
      ].join('|')
    }

    const existing = await ctx.db
      .query(tableName)
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

    const processedKeys = new Set<string>()

    for (const change of args.changes) {
      if (
        change.previous_crawl_id !== args.previous_crawl_id ||
        change.crawl_id !== args.crawl_id
      ) {
        throw new Error('Change pair mismatch in replacePair mutation')
      }

      const key = changeKey(change)

      // Skip duplicate changes in the same batch
      if (processedKeys.has(key)) {
        continue
      }
      processedKeys.add(key)

      const current = existingByKey.get(key)

      if (!current) {
        await ctx.db.insert(tableName, change)
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
  returns: v.array(unionDocValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query(tableName)
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
    const doc = await ctx.db.query(tableName).withIndex('by_crawl_id').order('desc').first()
    return doc?.crawl_id ?? null
  },
})

export const dev_collect = query({
  handler: async (ctx) => {
    return await ctx.db.query(tableName).withIndex('by_crawl_id').order('desc').collect()
  },
})
