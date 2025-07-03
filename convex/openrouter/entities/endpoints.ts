import { v } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { type MutationCtx, type QueryCtx } from '../../_generated/server'
import { Table2 } from '../../table2'

export const OrEndpoints = Table2('or_endpoints', {
  uuid: v.string(),
  name: v.string(),

  model_slug: v.string(),
  model_permaslug: v.string(),
  model_variant: v.string(),

  provider_slug: v.string(),
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

    rpm: v.optional(v.number()),
    rpd: v.optional(v.number()),
  }),

  data_policy: v.object({
    training: v.optional(v.boolean()),
    retains_prompts: v.optional(v.boolean()),
    retention_days: v.optional(v.number()),
    requires_user_ids: v.optional(v.boolean()),
    can_publish: v.optional(v.boolean()),
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

  variable_pricings: v.optional(
    v.array(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))),
  ),

  stats: v.optional(
    v.object({
      p50_throughput: v.number(),
      p50_latency: v.number(),
      request_count: v.number(),
    }),
  ),

  status: v.number(),

  is_disabled: v.boolean(),
  is_moderated: v.boolean(),

  or_model_created_at: v.number(),

  snapshot_at: v.number(),
})

export const OrEndpointsChanges = Table2('or_endpoints_changes', {
  uuid: v.string(),
  snapshot_at: v.number(),
  changes: v.array(v.record(v.string(), v.any())),
})

export const OrEndpointsFn = {
  get: async (ctx: QueryCtx, { uuid }: { uuid: string }) => {
    return await ctx.db
      .query(OrEndpoints.name)
      .withIndex('by_uuid', (q) => q.eq('uuid', uuid))
      .first()
  },

  diff: (a: unknown, b: unknown) =>
    diff(a, b, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at', 'stats'],
      embeddedObjKeys: {
        supported_parameters: '$value',
      },
    }),

  recordChanges: async (
    ctx: MutationCtx,
    { content, changes }: { content: { uuid: string; snapshot_at: number }; changes: IChange[] },
  ) => {
    if (changes.length === 0) return
    const { uuid, snapshot_at } = content
    await ctx.db.insert(OrEndpointsChanges.name, { uuid, snapshot_at, changes })
  },
}
