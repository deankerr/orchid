import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, type QueryCtx } from '../../_generated/server'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
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
}).index('by_permaslug_variant', ['model_permaslug', 'model_variant'])

export const vTable = createTableVHelper('or_model_app_leaderboards', table.validator)

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
  returns: v.null(),
  handler: async (ctx, args) => {
    await asyncMap(args.items, async (item) => {
      const existing = await ctx.db
        .query(vTable.name)
        .withIndex('by_permaslug_variant', (q) =>
          q.eq('model_permaslug', item.model_permaslug).eq('model_variant', item.model_variant),
        )
        .first()

      // Insert
      if (!existing) {
        return await ctx.db.insert(vTable.name, item)
      }

      return await ctx.db.replace(existing._id, item)
    })
  },
})
