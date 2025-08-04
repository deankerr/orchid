import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { diff as jsonDiff } from 'json-diff-ts'

import { internalMutation } from '../../_generated/server'
import { fnQueryLite } from '../../fnHelperLite'
import { hoursBetween } from '../../shared'
import { createTableVHelper } from '../../table3'
import { getCurrentSnapshotTimestamp } from '../snapshot/runs'

export const vModelStats = v.record(
  v.string(), // variant
  v.object({
    tokens_7d: v.number(),
    tokens_30d: v.number(),
    tokens_90d: v.number(),
    requests_7d: v.number(),
    requests_30d: v.number(),
    requests_90d: v.number(),
  }),
)

export const table = defineTable({
  slug: v.string(),
  permaslug: v.string(),
  variants: v.array(v.string()),

  author_slug: v.string(),
  author_name: v.optional(v.string()),

  name: v.string(),
  short_name: v.string(),
  description: v.string(),
  tokenizer: v.string(),
  instruct_type: v.optional(v.string()),
  hugging_face_id: v.optional(v.string()),
  warning_message: v.optional(v.string()),

  context_length: v.number(),
  input_modalities: v.array(v.string()),
  output_modalities: v.array(v.string()),
  reasoning_config: v.optional(
    v.object({
      start_token: v.string(),
      end_token: v.string(),
    }),
  ),

  or_created_at: v.number(),
  or_updated_at: v.number(),

  stats: vModelStats,

  snapshot_at: v.number(),
}).index('by_slug', ['slug'])

export const vTable = createTableVHelper('or_models', table.validator)

export const diff = (a: unknown, b: unknown) =>
  jsonDiff(a, b, {
    keysToSkip: ['_id', '_creationTime', 'stats', 'snapshot_at'],
    embeddedObjKeys: {
      input_modalities: '$value',
      output_modalities: '$value',
      variants: '$value',
    },
  })

// * queries
export const get = fnQueryLite({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query(vTable.name)
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
  },
})

export const list = fnQueryLite({
  handler: async (ctx) => {
    const snapshot_at = await getCurrentSnapshotTimestamp(ctx)
    const authors = await ctx.db.query('or_authors').collect()

    const models = await ctx.db
      .query(vTable.name)
      .collect()
      .then(
        (res) =>
          res
            .map((m) => ({
              ...m,
              staleness_hours: hoursBetween(m.snapshot_at, snapshot_at),
            }))
            .filter((m) => m.staleness_hours < 1), // NOTE: remove all stale models
      )

    return models.map((m) => ({
      ...m,
      author_name: authors.find((a) => a.slug === m.author_slug)?.name ?? m.author_slug,
    }))
  },
})

// * snapshots
export const upsert = internalMutation({
  args: { items: v.array(vTable.validator) },
  handler: async (ctx, args) => {
    await asyncMap(args.items, async (item) => {
      const existing = await ctx.db
        .query(vTable.name)
        .withIndex('by_slug', (q) => q.eq('slug', item.slug))
        .first()

      // Insert
      if (!existing) {
        return await ctx.db.insert(vTable.name, item)
      }

      const stats = Object.keys(item.stats).length > 0 ? item.stats : existing.stats

      // Update
      return await ctx.db.replace(existing._id, { ...item, stats })
    })
  },
})
