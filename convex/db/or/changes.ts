import { defineTable, paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, query } from '../../_generated/server'
import { createTableVHelper } from '../../lib/vTable'

export type ChangeBody = {
  type: 'ADD' | 'UPDATE' | 'REMOVE'
  key: string
  embeddedKey?: string
  value?: any
  oldValue?: any
  changes?: ChangeBody[]
}

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
  .index('change_action', ['change_action'])
  .index('entity_type', ['entity_type'])
  .index('is_display', ['is_display'])
  .index('entity_type__is_display', ['entity_type', 'is_display'])
  .index('change_action__is_display', ['change_action', 'is_display'])
  .index('entity_type__change_action__is_display', ['entity_type', 'change_action', 'is_display'])

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
    updates: v.array(
      v.object({
        _id: v.id('or_changes'),
        is_display: v.boolean(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update._id, { is_display: update.is_display })
    }
  },
})

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    entity_type: v.optional(
      v.union(v.literal('model'), v.literal('endpoint'), v.literal('provider')),
    ),
    change_action: v.optional(
      v.union(v.literal('create'), v.literal('update'), v.literal('delete')),
    ),
    include_hidden: v.optional(v.boolean()),
  },
  handler: async (ctx, { paginationOpts, entity_type, change_action, include_hidden }) => {
    const showHidden = include_hidden ?? false

    // Use the most specific compound index available based on provided parameters
    if (entity_type && change_action && !showHidden) {
      // Most specific: entity_type + change_action + is_display
      return await ctx.db
        .query('or_changes')
        .withIndex('entity_type__change_action__is_display', (q) =>
          q
            .eq('entity_type', entity_type)
            .eq('change_action', change_action)
            .eq('is_display', true),
        )
        .order('desc')
        .paginate(paginationOpts)
    }

    if (entity_type && !showHidden) {
      // entity_type + is_display (change_action is falsy here due to condition ordering)
      return await ctx.db
        .query('or_changes')
        .withIndex('entity_type__is_display', (q) =>
          q.eq('entity_type', entity_type).eq('is_display', true),
        )
        .order('desc')
        .paginate(paginationOpts)
    }

    if (entity_type && showHidden) {
      // entity_type only (change_action is falsy here due to condition ordering)
      return await ctx.db
        .query('or_changes')
        .withIndex('entity_type', (q) => q.eq('entity_type', entity_type))
        .order('desc')
        .paginate(paginationOpts)
    }

    if (change_action && !showHidden) {
      // change_action + is_display
      return await ctx.db
        .query('or_changes')
        .withIndex('change_action__is_display', (q) =>
          q.eq('change_action', change_action).eq('is_display', true),
        )
        .order('desc')
        .paginate(paginationOpts)
    }

    if (change_action && showHidden) {
      // change_action only
      return await ctx.db
        .query('or_changes')
        .withIndex('change_action', (q) => q.eq('change_action', change_action))
        .order('desc')
        .paginate(paginationOpts)
    }

    if (!showHidden) {
      // is_display only
      return await ctx.db
        .query('or_changes')
        .withIndex('is_display', (q) => q.eq('is_display', true))
        .order('desc')
        .paginate(paginationOpts)
    }

    // Default: show all changes
    return await ctx.db.query('or_changes').order('desc').paginate(paginationOpts)
  },
})
