import { v } from 'convex/values'

import { diff as jsonDiff, type IChange } from 'json-diff-ts'

import { internalMutation, query, type MutationCtx } from '../../_generated/server'
import { Table2 } from '../../table2'
import { type UpsertResult } from '../output'

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

const diff = (a: unknown, b: unknown) =>
  jsonDiff(a, b, {
    keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    embeddedObjKeys: {
      datacenters: '$value',
    },
  })

const recordChanges = async (
  ctx: MutationCtx,
  { content, changes }: { content: { slug: string; snapshot_at: number }; changes: IChange[] },
) => {
  if (changes.length === 0) return
  const { slug, snapshot_at } = content
  await ctx.db.insert(OrProvidersChanges.name, { slug, snapshot_at, changes })
}

export const upsert = internalMutation({
  args: {
    items: v.array(OrProviders.content),
  },
  handler: async (ctx, { items }: { items: (typeof OrProviders.$content)[] }) => {
    const results: UpsertResult[] = []

    for (const item of items) {
      const existing = await ctx.db
        .query(OrProviders.name)
        .withIndex('by_slug', (q) => q.eq('slug', item.slug))
        .first()
      const changes = diff(existing ?? {}, item)

      // Record changes
      await recordChanges(ctx, { content: item, changes })

      // Insert
      if (!existing) {
        await ctx.db.insert(OrProviders.name, item)
        results.push({ action: 'insert' })
        continue
      }

      // Stable - no changes
      if (changes.length === 0) {
        await ctx.db.patch(existing._id, { snapshot_at: item.snapshot_at })
        results.push({ action: 'stable' })
        continue
      }

      // Update
      await ctx.db.replace(existing._id, item)
      results.push({ action: 'update' })
    }

    return results
  },
})

// * queries

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query('or_providers').collect()
  },
})
