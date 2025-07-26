import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { diff as jsonDiff } from 'json-diff-ts'

import { fnMutationLite, fnQueryLite } from '../../fnHelperLite'
import { countResults } from '../../openrouter/utils'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
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
}).index('by_permaslug_variant', ['model_permaslug', 'model_variant'])

export const vTable = createTableVHelper('or_model_token_stats', table.validator)

const diff = (a: unknown, b: unknown) =>
  jsonDiff(a, b, {
    keysToSkip: ['_id', '_creationTime'],
  })

// * queries
export const get = fnQueryLite({
  args: {
    permaslug: v.string(),
    variants: v.array(v.string()),
  },
  handler: async (ctx, { permaslug, variants }) => {
    const results = await ctx.db
      .query(vTable.name)
      .withIndex('by_permaslug_variant', (q) => q.eq('model_permaslug', permaslug))
      .order('desc')
      .collect()

    return variants.map((variant) => results.find((r) => r.model_variant === variant) ?? null)
  },
})

// * snapshots
export const upsert = fnMutationLite({
  args: { items: v.array(vTable.validator) },
  handler: async (ctx, args) => {
    const results = await asyncMap(args.items, async (item) => {
      const existing = await ctx.db
        .query(vTable.name)
        .withIndex('by_permaslug_variant', (q) =>
          q.eq('model_permaslug', item.model_permaslug).eq('model_variant', item.model_variant),
        )
        .first()
      const changes = diff(existing ?? {}, item)

      // Insert
      if (!existing) {
        await ctx.db.insert(vTable.name, item)
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
