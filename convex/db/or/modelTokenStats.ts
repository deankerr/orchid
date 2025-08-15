import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, query } from '../../_generated/server'
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

// * queries
export const get = query({
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
export const upsert = internalMutation({
  args: { items: v.array(vTable.validator) },
  handler: async (ctx, args) => {
    await asyncMap(args.items, async (item) => {
      const existing = await ctx.db
        .query(vTable.name)
        .withIndex('by_permaslug_variant', (q) =>
          q.eq('model_permaslug', item.model_permaslug).eq('model_variant', item.model_variant),
        )
        .first()

      if (!existing) {
        return await ctx.db.insert(vTable.name, item)
      }

      return await ctx.db.replace(existing._id, item)
    })
  },
})
