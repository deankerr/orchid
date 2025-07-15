import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'

import { diff as jsonDiff } from 'json-diff-ts'

import { internalMutation, query } from '../../_generated/server'
import { Table2 } from '../../table2'
import { countResults } from '../output'

export const OrModelTokenStats = Table2('or_model_token_stats', {
  model_slug: v.string(),
  model_permaslug: v.string(),
  model_variant: v.string(),

  stats: v.array(
    v.object({
      timestamp: v.number(),
      input: v.number(),
      output: v.number(),
      reasoning: v.number(),
      requests: v.number(),
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
    items: v.array(OrModelTokenStats.content),
  },
  handler: async (ctx, { items }) => {
    const results = await asyncMap(items, async (item) => {
      const existing = await ctx.db
        .query(OrModelTokenStats.name)
        .withIndex('by_permaslug_variant', (q) =>
          q.eq('model_permaslug', item.model_permaslug).eq('model_variant', item.model_variant),
        )
        .first()
      const changes = diff(existing ?? {}, item)

      // Insert
      if (!existing) {
        await ctx.db.insert(OrModelTokenStats.name, item)
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

    return countResults(results, 'modelTokenStats')
  },
})

export const get = query({
  args: {
    permaslug: v.string(),
    variants: v.array(v.string()),
  },
  handler: async (ctx, { permaslug, variants }) => {
    const results = await ctx.db
      .query(OrModelTokenStats.name)
      .withIndex('by_permaslug_variant', (q) => q.eq('model_permaslug', permaslug))
      .order('desc')
      .collect()

    return variants.map((variant) => results.find((r) => r.model_variant === variant) ?? null)
  },
})
