import { defineTable, paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, internalQuery } from '../../_generated/server'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  crawl_id: v.string(),
  from_crawl_id: v.string(),

  change_action: v.union(v.literal('create'), v.literal('update'), v.literal('delete')),
  change_root_key: v.string(),
  change_body: v.record(v.string(), v.any()),

  entity_type: v.union(v.literal('model'), v.literal('endpoint'), v.literal('provider')),
  entity_id: v.string(),
  entity_display_name: v.string(),

  model_variant_slug: v.optional(v.string()),
  endpoint_uuid: v.optional(v.string()),
  provider_slug: v.optional(v.string()),
  provider_id: v.optional(v.string()),

  is_display: v.boolean(),
})
  .index('crawl_id', ['crawl_id'])
  .index('entity_type', ['entity_type'])
  .index('is_display', ['is_display'])
  .index('crawl_id_display', ['crawl_id', 'is_display'])
  .index('entity_type_display', ['entity_type', 'is_display'])

export const vTable = createTableVHelper('or_changes', table.validator)

export const insert = internalMutation({
  args: {
    changes: vTable.validator.array(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const change of args.changes) {
      await ctx.db.insert('or_changes', change)
    }
  },
})

export const updateDisplayStatus = internalMutation({
  args: {
    updates: v.array(v.object({
      _id: v.id('or_changes'),
      is_display: v.boolean(),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update._id, { is_display: update.is_display })
    }
  },
})

export const list = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('or_changes')
      .order('desc')
      .paginate(args.paginationOpts)
  },
})
