import { Table } from 'convex-helpers/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { MergeResult } from '../types'

export const OrProviders = Table('or_providers', {
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

export type OrProviderFields = Infer<AsObjectValidator<typeof OrProviders.withoutSystemFields>>

export const OrProvidersChanges = Table('or_providers_changes', {
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

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    })
  },

  insertChanges: async (
    ctx: MutationCtx,
    args: { slug: string; snapshot_at: number; changes: IChange[] },
  ) => {
    await ctx.db.insert(OrProvidersChanges.name, args)
  },

  merge: async (
    ctx: MutationCtx,
    { provider }: { provider: OrProviderFields },
  ): Promise<MergeResult> => {
    const existing = await OrProvidersFn.get(ctx, { slug: provider.slug })
    const changes = OrProvidersFn.diff(existing || {}, provider)

    // changes
    if (changes.length > 0) {
      await OrProvidersFn.insertChanges(ctx, {
        slug: provider.slug,
        snapshot_at: provider.snapshot_at,
        changes,
      })
    }

    // new view
    if (!existing) {
      const docId = await ctx.db.insert(OrProviders.name, provider)
      return {
        action: 'insert' as const,
        docId,
        changes,
      }
    }

    // existing view
    if (changes.length === 0) {
      if (existing.snapshot_at < provider.snapshot_at) {
        await ctx.db.patch(existing._id, {
          snapshot_at: provider.snapshot_at,
        })
      }

      return {
        action: 'stable' as const,
        docId: existing._id,
        changes,
      }
    }

    await ctx.db.replace(existing._id, provider)
    return {
      action: 'replace' as const,
      docId: existing._id,
      changes,
    }
  },
}
