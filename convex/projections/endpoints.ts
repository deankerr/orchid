import { v, type Infer } from 'convex/values'
import { z } from 'zod'
import type { Doc } from '../_generated/dataModel'
import { OpenRouterFrontendEndpointRecordSchema } from '../openrouter/schemas/api_frontend_stats_endpoint'
import { readSnapshotData } from '../snapshots'
import type { vModel } from './models'

// draft table schema
export const vEndpoint = v.object({
  uuid: v.string(),
  modelSlug: v.string(),
  modelVariantSlug: v.string(),
  modelVariantPermaslug: v.string(),
  providerId: v.string(), // provider_slug

  name: v.string(),
  providerName: v.string(),
  variant: v.string(),
  contextLength: v.number(),
  quantization: v.optional(v.string()),
  supportedParameters: v.array(v.string()), // ? should store some as features? structured_outputs etc.

  capabilities: v.object({
    completion: v.boolean(),
    chat: v.boolean(),

    imageInput: v.boolean(),
    fileInput: v.boolean(),

    reasoning: v.boolean(),
    tools: v.boolean(),
    multipart: v.boolean(), // ? if image || file = this must be true?
    cancellation: v.boolean(),
    byok: v.boolean(),

    moderation: v.boolean(),
  }),

  limits: v.object({
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),

    imagesPerPrompt: v.optional(v.number()),
    tokensPerImage: v.optional(v.number()),

    requestsPerMinute: v.optional(v.number()),
    requestsPerDay: v.optional(v.number()),
    requestsPerMinuteCf: v.optional(v.number()), // TODO: investigate
  }),

  pricing: v.object({
    // per token
    input: v.string(),
    output: v.string(),
    imageInput: v.string(),
    inputCacheRead: v.optional(v.string()),
    inputCacheWrite: v.optional(v.string()),
    reasoningOutput: v.optional(v.string()),
    // flat rate
    request: v.string(),
  }),

  variablePricings: v.array(v.record(v.string(), v.any())), // TODO: investigate

  dataPolicy: v.object({
    // move to provider?
    termsOfServiceURL: v.optional(v.string()),
    privacyPolicyURL: v.optional(v.string()),
    dataPolicyUrl: v.optional(v.string()),

    training: v.optional(v.boolean()),
    retainsPrompts: v.optional(v.boolean()),
    retentionDays: v.optional(v.number()),
    requiresUserIDs: v.optional(v.boolean()),
  }),

  status: v.optional(v.number()), // ? what endpoints lack this?
  isDeranked: v.boolean(), // ? status < 0
  isDisabled: v.boolean(), // ? should we even use disabled endpoints?

  orModelCreatedAt: v.number(),
  orModelUpdatedAt: v.number(),

  epoch: v.number(),
})

export function processEndpointsSnapshot(
  model: Omit<Infer<typeof vModel>, 'epoch'>,
  snapshot: Doc<'snapshots'>,
) {
  const raw = readSnapshotData(snapshot)

  const { data } = z.object({ data: OpenRouterFrontendEndpointRecordSchema.array() }).parse(raw)

  const endpoints = data.map((data) => {
    const endpoint: Omit<Infer<typeof vEndpoint>, 'epoch'> = {
      uuid: data.id,
      modelSlug: model.slug,
      modelVariantSlug: data.model_variant_slug,
      modelVariantPermaslug: data.model_variant_permaslug,
      providerId: data.provider_slug,

      name: data.name,
      providerName: data.provider_display_name,
      variant: data.variant,
      contextLength: data.context_length,
      quantization: data.quantization ?? undefined,
      supportedParameters: data.supported_parameters,

      capabilities: {
        completion: data.has_completions,
        chat: data.has_chat_completions,

        imageInput: model.inputModalities.includes('image'),
        fileInput: model.inputModalities.includes('file'),

        reasoning: data.supports_reasoning,
        tools: data.supports_tool_parameters,
        multipart: data.supports_multipart,
        cancellation: data.can_abort,
        byok: data.is_byok,
        moderation: data.moderation_required,
      },

      limits: {
        inputTokens: data.max_prompt_tokens ?? undefined,
        outputTokens: data.max_completion_tokens ?? undefined,
        imagesPerPrompt: data.max_prompt_images ?? undefined,
        tokensPerImage: data.max_tokens_per_image ?? undefined,
      },

      pricing: {
        input: data.pricing.prompt,
        output: data.pricing.completion,
        imageInput: data.pricing.image,
        inputCacheRead: data.pricing.input_cache_read,
        inputCacheWrite: data.pricing.input_cache_write,
        reasoningOutput: data.pricing.internal_reasoning,
        request: data.pricing.request,
      },

      variablePricings: data.variable_pricings,

      dataPolicy: {
        termsOfServiceURL: data.data_policy.termsOfServiceURL,
        privacyPolicyURL: data.data_policy.privacyPolicyURL,
        dataPolicyUrl: data.data_policy.dataPolicyUrl,

        training: data.data_policy.training,
        retainsPrompts: data.data_policy.retainsPrompts,
        retentionDays: data.data_policy.retentionDays,
        requiresUserIDs: data.data_policy.requiresUserIDs,
      },

      status: data.status,
      isDeranked: data.is_deranked,
      isDisabled: data.is_disabled,

      orModelCreatedAt: model.orCreatedAt,
      orModelUpdatedAt: model.orUpdatedAt,
    }

    const stats = data.stats
      ? {
          p50Throughput: data.stats.p50_throughput,
          p50Latency: data.stats.p50_latency,
          requestCount: data.stats.request_count,
        }
      : undefined

    return { endpoint, stats }
  })

  return endpoints
}
