import { Table } from 'convex-helpers/server'
import { v, type Infer } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { diff, type IChange } from 'json-diff-ts'
import type { WithoutSystemFields } from 'convex/server'
import type { MergeResult } from '../types'

export const ProviderViews = Table('provider_views', {
  slug: v.string(),
  name: v.string(),
  headquarters: v.optional(v.string()),
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
    }),

    free_models: v.optional(
      v.object({
        training: v.boolean(),
        retains_prompts: v.boolean(),
        retention_days: v.optional(v.number()),
      }),
    ),
  }),

  epoch: v.number(),
})

export type ProviderViewsDoc = Infer<typeof ProviderViews.doc>
export type ProviderView = WithoutSystemFields<ProviderViewsDoc>

export const ProviderViewFn = {
  get: async (ctx: QueryCtx, { slug }: { slug: string }) => {
    return await ctx.db
      .query(ProviderViews.name)
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'epoch'],
    })
  },

  insertChanges: async (ctx: MutationCtx, args: { slug: string; epoch: number; changes: IChange[] }) => {
    await ctx.db.insert('provider_views_changes', args)
  },

  merge: async (ctx: MutationCtx, { provider }: { provider: ProviderView }): Promise<MergeResult> => {
    const existing = await ProviderViewFn.get(ctx, { slug: provider.slug })
    const changes = ProviderViewFn.diff(existing || {}, provider)

    // changes
    if (changes.length > 0) {
      await ProviderViewFn.insertChanges(ctx, {
        slug: provider.slug,
        epoch: provider.epoch,
        changes,
      })
    }

    // new view
    if (!existing) {
      const _id = await ctx.db.insert(ProviderViews.name, provider)
      return {
        action: 'insert' as const,
        _id,
        diff: changes,
      }
    }

    // existing view
    if (changes.length === 0) {
      if (existing.epoch < provider.epoch) {
        await ctx.db.patch(existing._id, {
          epoch: provider.epoch,
        })
      }

      return {
        action: 'stable' as const,
        _id: existing._id,
        diff: changes,
      }
    }

    await ctx.db.replace(existing._id, provider)
    return {
      action: 'replace' as const,
      _id: existing._id,
      diff: changes,
    }
  },
}
