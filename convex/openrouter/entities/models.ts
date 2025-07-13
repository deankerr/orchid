import { v } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { internalMutation, query, type MutationCtx, type QueryCtx } from '../../_generated/server'
import { hoursBetween } from '../../shared'
import { Table2 } from '../../table2'
import { getCurrentSnapshotTimestamp } from '../snapshot'

export const vModelStatsRecord = v.record(
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

export const OrModels = Table2('or_models', {
  slug: v.string(),
  permaslug: v.string(),
  variants: v.array(v.string()),

  author_slug: v.string(),

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

  stats: vModelStatsRecord,

  snapshot_at: v.number(),
})

export const OrModelsChanges = Table2('or_models_changes', {
  slug: v.string(),
  snapshot_at: v.number(),
  changes: v.array(v.record(v.string(), v.any())),
})

export const OrModelsFn = {
  get: async (ctx: QueryCtx, { slug }: { slug: string }) => {
    return await ctx.db
      .query(OrModels.name)
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
  },

  diff: (a: unknown, b: unknown) =>
    diff(a, b, {
      keysToSkip: ['_id', '_creationTime', 'stats', 'snapshot_at'],
      embeddedObjKeys: {
        input_modalities: '$value',
        output_modalities: '$value',
        variants: '$value',
      },
    }),

  recordChanges: async (
    ctx: MutationCtx,
    { content, changes }: { content: { slug: string; snapshot_at: number }; changes: IChange[] },
  ) => {
    if (changes.length === 0) return
    const { slug, snapshot_at } = content
    await ctx.db.insert(OrModelsChanges.name, { slug, snapshot_at, changes })
  },
}

export const updateStats = internalMutation({
  args: {
    items: v.array(
      v.object({
        permaslug: v.string(),
        stats: vModelStatsRecord,
      }),
    ),
  },
  handler: async (ctx, { items }) => {
    const models = await ctx.db.query(OrModels.name).collect()
    const statsMap = new Map(items.map((item) => [item.permaslug, item.stats]))

    for (const model of models) {
      const newStats = statsMap.get(model.permaslug)

      if (newStats) {
        // We have stats for this model - check if they need updating
        const changes = diff(model.stats ?? {}, newStats)

        if (changes.length > 0) {
          await ctx.db.patch(model._id, { stats: newStats })
        }
      } else {
        // We don't have stats for this model - ensure it has empty stats
        if (model.stats && Object.keys(model.stats).length > 0) {
          await ctx.db.patch(model._id, { stats: {} })
        }
      }
    }
  },
})

// * queries

export const get = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('or_models')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
  },
})

export const list = query({
  handler: async (ctx) => {
    const snapshot_at = await getCurrentSnapshotTimestamp(ctx)
    const authors = await ctx.db.query('or_authors').collect()

    const models = await ctx.db
      .query('or_models')
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
