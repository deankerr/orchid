import { Table } from 'convex-helpers/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { MergeResult } from '../types'

export const OrEndpoints = Table('or_endpoints', {
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
    web_search: v.optional(v.number()),

    cache_read: v.optional(v.number()),
    cache_write: v.optional(v.number()),

    // flat rate
    per_request: v.optional(v.number()),

    // e.g. 0.25, already applied to the other pricing fields
    discount: v.optional(v.number()),
  }),

  status: v.number(),

  is_disabled: v.boolean(),
  is_moderated: v.boolean(),

  or_model_created_at: v.number(),

  snapshot_at: v.number(),
})

export type OrEndpointFields = Infer<AsObjectValidator<typeof OrEndpoints.withoutSystemFields>>

export const OrEndpointsFn = {
  get: async (ctx: QueryCtx, { uuid }: { uuid: string }) => {
    return await ctx.db
      .query(OrEndpoints.name)
      .withIndex('by_uuid', (q) => q.eq('uuid', uuid))
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
      embeddedObjKeys: {
        supported_parameters: '$value',
      },
    })
  },

  insertChanges: async (
    ctx: MutationCtx,
    args: { uuid: string; snapshot_at: number; changes: IChange[] },
  ) => {
    await ctx.db.insert('or_endpoints_changes', args)
  },

  merge: async (
    ctx: MutationCtx,
    { endpoint }: { endpoint: OrEndpointFields },
  ): Promise<MergeResult> => {
    const existing = await OrEndpointsFn.get(ctx, { uuid: endpoint.uuid })
    const changes = OrEndpointsFn.diff(existing || {}, endpoint)

    // changes
    if (changes.length > 0) {
      await OrEndpointsFn.insertChanges(ctx, {
        uuid: endpoint.uuid,
        snapshot_at: endpoint.snapshot_at,
        changes,
      })
    }

    // new view
    if (!existing) {
      const docId = await ctx.db.insert(OrEndpoints.name, endpoint)
      return {
        action: 'insert' as const,
        docId,
        changes,
      }
    }

    // existing view
    if (changes.length === 0) {
      if (existing.snapshot_at < endpoint.snapshot_at) {
        await ctx.db.patch(existing._id, {
          snapshot_at: endpoint.snapshot_at,
        })
      }

      return {
        action: 'stable' as const,
        docId: existing._id,
        changes,
      }
    }

    await ctx.db.replace(existing._id, endpoint)
    return {
      action: 'replace' as const,
      docId: existing._id,
      changes,
    }
  },
}
