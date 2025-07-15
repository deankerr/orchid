import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'

import { diff as jsonDiff } from 'json-diff-ts'

import { internalMutation, query } from '../../_generated/server'
import { Table2 } from '../../table2'

export const OrModelAppLeaderboards = Table2('or_model_app_leaderboards', {
  model_permaslug: v.string(),
  model_variant: v.string(),
  apps: v.array(
    v.object({
      app_id: v.number(),
      total_tokens: v.number(),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      main_url: v.optional(v.string()),
      origin_url: v.string(),
      source_code_url: v.optional(v.string()),
      or_created_at: v.number(),
    }),
  ),

  snapshot_at: v.number(),
})

const diff = (a: unknown, b: unknown) =>
  jsonDiff(a, b, {
    keysToSkip: ['_id', '_creationTime'],
  })

export const upsert = internalMutation({
  args: {
    items: v.array(OrModelAppLeaderboards.content),
  },
  handler: async (ctx, { items }) => {
    return await asyncMap(items, async (item) => {
      const existing = await ctx.db
        .query('or_model_app_leaderboards')
        .withIndex('by_permaslug_variant', (q) =>
          q.eq('model_permaslug', item.model_permaslug).eq('model_variant', item.model_variant),
        )
        .first()

      const changes = diff(existing ?? {}, item)

      // Insert
      if (!existing) {
        await ctx.db.insert(OrModelAppLeaderboards.name, item)
        return { action: 'insert' }
      }

      // Stable
      if (changes.length === 0) {
        return { action: 'stable' }
      }

      // Update
      await ctx.db.replace(existing._id, item)
      return { action: 'update' }
    })
  },
})

// * queries

export const get = query({
  args: {
    permaslug: v.string(),
    snapshot_at: v.optional(v.number()),
  },
  handler: async (ctx, { permaslug, snapshot_at }) => {
    const results = await ctx.db
      .query('or_model_app_leaderboards')
      .withIndex('by_permaslug_snapshot_at', (q) => {
        return snapshot_at
          ? q.eq('model_permaslug', permaslug).eq('snapshot_at', snapshot_at)
          : q.eq('model_permaslug', permaslug)
      })
      .order('desc')
      .collect()

    return [...Map.groupBy(results, (r) => r.model_variant)].map(
      ([key, items]) => [key, items[0]] as const,
    )
  },
})
