import { defineTable } from 'convex/server'
import { ConvexError, v, type AsObjectValidator, type Infer } from 'convex/values'
import { openrouter } from '../openrouter/client'
import { OpenRouterFrontendEndpointRecordSchema } from '../openrouter/schemas/api_frontend_stats_endpoint'
import type { MutationCtx } from '../_generated/server'
import { diff } from 'json-diff-ts'

export const endpointsTable = defineTable({
  uuid: v.string(),
  model_slug: v.string(),
  model_variant_slug: v.string(),
  model_variant_permaslug: v.string(),

  provider_id: v.string(),
  provider_name: v.string(),

  name: v.string(),
  variant: v.string(),
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
    input: v.string(),
    output: v.string(),
    image_input: v.optional(v.string()),
    reasoning_output: v.optional(v.string()),

    cache_read: v.optional(v.string()),
    cache_write: v.optional(v.string()),

    // flat rate
    request: v.optional(v.string()),
  }),

  status: v.number(),

  is_disabled: v.boolean(),
  is_moderated: v.boolean(),

  origin_model_created_at: v.number(),
  origin_model_updated_at: v.number(),

  epoch: v.number(),
}).index('by_uuid', ['uuid'])

export const vEndpointFields = endpointsTable.validator.fields

export function parseEndpointRecord(record: unknown) {
  const parsed = OpenRouterFrontendEndpointRecordSchema.parse(record)

  const endpoint = {
    uuid: parsed.id,
    model_variant_slug: parsed.model_variant_slug,
    model_variant_permaslug: parsed.model_variant_permaslug,

    provider_id: parsed.provider_slug,
    provider_name: parsed.provider_display_name,

    name: parsed.name,
    variant: parsed.variant,
    context_length: parsed.context_length,
    quantization: parsed.quantization || undefined,
    supported_parameters: parsed.supported_parameters,

    capabilities: {
      completions: parsed.has_completions,
      chat_completions: parsed.has_chat_completions,
      reasoning: parsed.supports_reasoning,
      tools: parsed.supports_tool_parameters,
      multipart_messages: parsed.supports_multipart,
      stream_cancellation: parsed.can_abort,
      byok: parsed.is_byok,
    },

    limits: {
      input_tokens: parsed.max_prompt_tokens || undefined,
      output_tokens: parsed.max_completion_tokens || undefined,
      images_per_prompt: parsed.max_prompt_images || undefined,
      tokens_per_image: parsed.max_tokens_per_image || undefined,
    },

    data_policy: {
      training: parsed.data_policy.training,
      retains_prompts: parsed.data_policy.retainsPrompts,
      retention_days: parsed.data_policy.retentionDays,
      requires_user_ids: parsed.data_policy.requiresUserIDs,
    },

    pricing: {
      input: parsed.pricing.prompt,
      output: parsed.pricing.completion,
      image_input: omitIf0(parsed.pricing.image),
      reasoning_output: omitIf0(parsed.pricing.internal_reasoning),
      cache_read: omitIf0(parsed.pricing.input_cache_read),
      cache_write: omitIf0(parsed.pricing.input_cache_write),
      request: omitIf0(parsed.pricing.request),
    },

    status: parsed.status ?? 0,
    is_disabled: parsed.is_disabled,
    is_moderated: parsed.moderation_required,
  }

  const stats = parsed.stats ? { ...parsed.stats, endpoint_uuid: parsed.id } : undefined

  return { endpoint, stats }
}

function omitIf0(input?: string) {
  if (input !== '0') return input
}

export async function fetchEndpoints(args: { permaslug: string; variant: string }) {
  const result = await openrouter.frontend.stats.endpoint({
    permaslug: args.permaslug,
    variant: args.variant,
  })
  if (!result.success) throw new ConvexError('failed to get endpoints')

  const parsed = result.data.map(parseEndpointRecord)
  const endpoints = parsed.map((p) => p.endpoint)
  const stats = parsed.map((p) => p.stats).filter((s) => s !== undefined)

  return { endpoints, stats }
}

export async function mergeEndpoint(
  ctx: MutationCtx,
  endpoint: Infer<AsObjectValidator<typeof vEndpointFields>>,
) {
  const existingEndpoint = await ctx.db
    .query('endpoints_v1')
    .withIndex('by_uuid', (q) => q.eq('uuid', endpoint.uuid))
    .first()

  const diffResults = diff(existingEndpoint || {}, endpoint, {
    keysToSkip: ['_id', '_creationTime', 'epoch'],
    embeddedObjKeys: {
      supported_parameters: '$value',
      pricing: '$value',
      limits: '$value',
      data_policy: '$value',
      capabilities: '$value',
    },
  })
  await ctx.db.insert('endpoints_v1_diff', { name: endpoint.name, epoch: endpoint.epoch, diff: diffResults })

  if (existingEndpoint) return await ctx.db.replace(existingEndpoint._id, endpoint)
  return await ctx.db.insert('endpoints_v1', endpoint)
}
