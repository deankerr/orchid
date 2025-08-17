import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, type QueryCtx } from '../../_generated/server'
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

export async function get(ctx: QueryCtx, args: { permaslug: string; variant: string }) {
  return await ctx.db
    .query(vTable.name)
    .withIndex('by_permaslug_variant', (q) =>
      q.eq('model_permaslug', args.permaslug).eq('model_variant', args.variant),
    )
    .first()
}

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
