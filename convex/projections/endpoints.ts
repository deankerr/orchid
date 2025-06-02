import { v, type Infer } from 'convex/values'
import { z } from 'zod'
import { OpenRouterFrontendEndpointRecordSchema } from '../openrouter/schemas/api_frontend_stats_endpoint'
import { type SnapshotWithData } from '../snapshots'
import type { vModel } from './models'

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
  supportedParameters: v.array(v.string()),

  capabilities: v.object({
    completion: v.boolean(),
    chat: v.boolean(),

    imageInput: v.boolean(),
    fileInput: v.boolean(),

    reasoning: v.boolean(),
    tools: v.boolean(),
    multipart: v.boolean(),
    cancellation: v.boolean(),
    byok: v.boolean(),
  }),

  limits: v.object({
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),

    imagesPerPrompt: v.optional(v.number()),
    tokensPerImage: v.optional(v.number()),
  }),

  pricing: v.object({
    // per token
    input: v.string(),
    output: v.string(),
    imageInput: v.optional(v.string()),
    cacheRead: v.optional(v.string()),
    cacheWrite: v.optional(v.string()),
    reasoningOutput: v.optional(v.string()),
    // flat rate
    request: v.optional(v.string()),
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

  status: v.number(),
  isDisabled: v.boolean(),

  orModerated: v.boolean(),
  orModelCreatedAt: v.number(),
  orModelUpdatedAt: v.number(),

  epoch: v.number(),
})

export function processEndpointsSnapshot(model: Infer<typeof vModel>, snapshot: SnapshotWithData) {
  const { data } = z.object({ data: OpenRouterFrontendEndpointRecordSchema.array() }).parse(snapshot.data)

  const endpoints = data.map((data) => {
    const endpoint: Infer<typeof vEndpoint> = {
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
        imageInput: pruneZero(data.pricing.image),
        cacheRead: pruneZero(data.pricing.input_cache_read),
        cacheWrite: pruneZero(data.pricing.input_cache_write),
        reasoningOutput: pruneZero(data.pricing.internal_reasoning),
        request: pruneZero(data.pricing.request),
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

      status: data.status ?? 0,
      isDisabled: data.is_disabled,

      orModerated: data.moderation_required,
      orModelCreatedAt: model.orCreatedAt,
      orModelUpdatedAt: model.orUpdatedAt,

      epoch: snapshot.epoch,
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

function pruneZero(input?: string) {
  if (input === '0') return undefined
  return input
}
