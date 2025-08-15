import { asyncMap, omit } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, query, type QueryCtx } from '../../_generated/server'

export const table = defineTable({
  slug: v.string(),
  description: v.string(),
  tokenizer: v.string(),
  instruct_type: v.optional(v.string()),
  warning_message: v.optional(v.string()),

  updated_at: v.number(),
}).index('by_slug', ['slug'])

async function getModelDetails(ctx: QueryCtx, slug: string) {
  return await ctx.db
    .query('or_model_details')
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .first()
}

export const get = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await getModelDetails(ctx, args.slug)
  },
})

export const upsert = internalMutation({
  args: { items: v.array(v.object(omit(table.validator.fields, ['updated_at']))) },
  handler: async (ctx, args) => {
    const updated_at = Date.now()

    await asyncMap(args.items, async (item) => {
      const fields = { ...item, updated_at }
      const existing = await getModelDetails(ctx, item.slug)
      if (existing) {
        await ctx.db.patch(existing._id, fields)
      } else {
        await ctx.db.insert('or_model_details', fields)
      }
    })
  },
})
