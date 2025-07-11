import { v } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { query, type MutationCtx, type QueryCtx } from '../../_generated/server'
import { Table2 } from '../../table2'

export const OrProviders = Table2('or_providers', {
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
        retains_prompts: v.boolean(),
        retention_days: v.optional(v.number()),
        can_publish: v.optional(v.boolean()),
      }),
    ),
  }),

  snapshot_at: v.number(),
})

export const OrProvidersChanges = Table2('or_providers_changes', {
  slug: v.string(),
  snapshot_at: v.number(),
  changes: v.array(v.record(v.string(), v.any())),
})

export const OrProvidersFn = {
  get: async (ctx: QueryCtx, { slug }: { slug: string }) => {
    return await ctx.db
      .query(OrProviders.name)
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
  },

  diff: (a: unknown, b: unknown) =>
    diff(a, b, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
      embeddedObjKeys: {
        datacenters: '$value',
      },
    }),

  recordChanges: async (
    ctx: MutationCtx,
    { content, changes }: { content: { slug: string; snapshot_at: number }; changes: IChange[] },
  ) => {
    if (changes.length === 0) return
    const { slug, snapshot_at } = content
    await ctx.db.insert(OrProvidersChanges.name, { slug, snapshot_at, changes })
  },
}

// * queries

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query('or_providers').collect()
  },
})
