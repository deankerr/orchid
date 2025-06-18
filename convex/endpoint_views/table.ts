import { Table } from 'convex-helpers/server'
import type { WithoutSystemFields } from 'convex/server'
import { v, type Infer } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { diff } from 'json-diff-ts'
import type { MergeResult } from '../types'
import * as R from 'remeda'

export const EndpointViews = Table('endpoint_views', {
  uuid: v.string(),
  name: v.string(),

  model_slug: v.string(),
  model_permaslug: v.string(),
  model_variant: v.string(),

  provider_id: v.string(),
  provider_name: v.string(),

  context_length: v.number(),
  quantization: v.optional(v.string()),
  supported_parameters: v.array(v.string()),

  capabilities: v.object({
    completions: v.boolean(),
    chat_completions: v.boolean(),

    image_input: v.boolean(),
    file_input: v.boolean(),

    reasoning: v.boolean(),
    tools: v.boolean(),
    multipart_messages: v.boolean(),
    stream_cancellation: v.boolean(),
    byok: v.boolean(),
  }),

  limits: v.object({
    input_tokens: v.optional(v.number()),
    output_tokens: v.optional(v.number()),

    images_per_prompt: v.optional(v.number()),
    tokens_per_image: v.optional(v.number()),
  }),

  data_policy: v.object({
    training: v.optional(v.boolean()),
    retains_prompts: v.optional(v.boolean()),
    retention_days: v.optional(v.number()),
    requires_user_ids: v.optional(v.boolean()),
  }),

  pricing: v.object({
    // per token
    input: v.optional(v.number()),
    output: v.optional(v.number()),
    image_input: v.optional(v.number()),
    reasoning_output: v.optional(v.number()),

    cache_read: v.optional(v.number()),
    cache_write: v.optional(v.number()),

    // flat rate
    per_request: v.optional(v.number()),
  }),

  status: v.number(),

  is_disabled: v.boolean(),
  is_moderated: v.boolean(),

  origin_model_created_at: v.number(),
  origin_model_updated_at: v.number(),

  epoch: v.number(),
})

export type EndpointViewsDoc = Infer<typeof EndpointViews.doc>
export type EndpointView = WithoutSystemFields<EndpointViewsDoc>

export const EndpointViewFn = {
  get: async (ctx: QueryCtx, { uuid }: { uuid: string }) => {
    return await ctx.db
      .query(EndpointViews.name)
      .withIndex('by_uuid', (q) => q.eq('uuid', uuid))
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime'],
    })
  },

  merge: async (ctx: MutationCtx, { endpoint }: { endpoint: EndpointView }): Promise<MergeResult> => {
    const existing = await EndpointViewFn.get(ctx, { uuid: endpoint.uuid })
    const diff = EndpointViewFn.diff(existing || {}, endpoint)

    if (existing) {
      if (diff.length === 0) {
        return {
          action: 'stable' as const,
          _id: existing._id,
          diff,
        }
      }

      if (R.only(diff)?.key === 'epoch') {
        await ctx.db.patch(existing._id, {
          epoch: endpoint.epoch,
        })

        return {
          action: 'stable' as const,
          _id: existing._id,
          diff,
        }
      }

      await ctx.db.replace(existing._id, endpoint)
      return {
        action: 'replace' as const,
        _id: existing._id,
        diff,
      }
    }

    const _id = await ctx.db.insert(EndpointViews.name, endpoint)
    return {
      action: 'insert' as const,
      _id,
      diff,
    }
  },
}
