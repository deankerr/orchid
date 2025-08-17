import { asyncMap, omit } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, type QueryCtx } from '../../_generated/server'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  slug: v.string(),
  description: v.string(),
  tokenizer: v.string(),
  instruct_type: v.optional(v.string()),
  warning_message: v.optional(v.string()),

  updated_at: v.number(),
}).index('by_slug', ['slug'])

export const vTable = createTableVHelper('or_model_details', table.validator)

export async function get(ctx: QueryCtx, slug: string) {
  return await ctx.db
    .query(vTable.name)
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .first()
}

export const upsert = internalMutation({
  args: { items: v.array(v.object(omit(table.validator.fields, ['updated_at']))) },
  handler: async (ctx, args) => {
    const updated_at = Date.now()

    await asyncMap(args.items, async (item) => {
      const fields = { ...item, updated_at }
      const existing = await get(ctx, item.slug)
      if (existing) {
        await ctx.db.patch(existing._id, fields)
      } else {
        await ctx.db.insert(vTable.name, fields)
      }
    })
  },
})
