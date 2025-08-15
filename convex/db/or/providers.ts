import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, query } from '../../_generated/server'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  slug: v.string(),
  name: v.string(),
  headquarters: v.optional(v.string()),
  datacenters: v.optional(v.array(v.string())),
  icon: v.object({
    url: v.string(),
    invertRequired: v.optional(v.boolean()),
  }),
  status_page_url: v.optional(v.string()),
  moderation_required: v.boolean(),

  capabilities: v.object({
    completions: v.boolean(),
    chat_completions: v.boolean(),
    multipart_messages: v.boolean(),
    stream_cancellation: v.boolean(),
    byok: v.boolean(),
  }),

  data_policy: v.object({
    terms_of_service_url: v.optional(v.string()),
    privacy_policy_url: v.optional(v.string()),
    data_policy_url: v.optional(v.string()),
    requires_user_ids: v.optional(v.boolean()),

    paid_models: v.object({
      training: v.boolean(),
      retains_prompts: v.optional(v.boolean()),
      retention_days: v.optional(v.number()),
      can_publish: v.optional(v.boolean()),
    }),

    free_models: v.optional(
      v.object({
        training: v.boolean(),
        retains_prompts: v.optional(v.boolean()),
        retention_days: v.optional(v.number()),
        can_publish: v.optional(v.boolean()),
      }),
    ),
  }),

  icon_url: v.optional(v.string()),

  snapshot_at: v.number(),
}).index('by_slug', ['slug'])

export const vTable = createTableVHelper('or_providers', table.validator)

// * queries
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query(vTable.name).collect()
  },
})

// * snapshots
export const upsert = internalMutation({
  args: { items: v.array(vTable.validator) },
  handler: async (ctx, args) => {
    await asyncMap(args.items, async (item) => {
      const existing = await ctx.db
        .query(vTable.name)
        .withIndex('by_slug', (q) => q.eq('slug', item.slug))
        .first()

      if (!existing) {
        return await ctx.db.insert(vTable.name, item)
      }

      return await ctx.db.replace(existing._id, item)
    })
  },
})
