import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation } from '../../_generated/server'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  app_id: v.number(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  main_url: v.optional(v.string()),
  origin_url: v.string(),
  source_code_url: v.optional(v.string()),
  or_created_at: v.number(),

  snapshot_at: v.number(),
}).index('by_app_id', ['app_id'])

export const vTable = createTableVHelper('or_apps', table.validator)

// * snapshots
export const upsert = internalMutation({
  args: { items: v.array(vTable.validator) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await asyncMap(args.items, async (item) => {
      const existing = await ctx.db
        .query(vTable.name)
        .withIndex('by_app_id', (q) => q.eq('app_id', item.app_id))
        .first()

      if (!existing) {
        return await ctx.db.insert(vTable.name, item)
      }

      return await ctx.db.replace(existing._id, item)
    })
  },
})
