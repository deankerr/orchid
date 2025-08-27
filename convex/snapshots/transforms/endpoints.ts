import * as R from 'remeda'
import { z } from 'zod'

import { DataPolicy } from './shared'

export const endpoints = z
  .object({
    id: z.string(), // primary key, uuid
    name: z.string(), // internal id, `{provider_name} | {model_variant_slug}`
    context_length: z.number(),
    model_variant_slug: z.string(), // {slug}:{variant}
    model_variant_permaslug: z.string(), // {permaslug}:{variant}
    provider_name: z.string(), // foreign internal id
    provider_info: z.object({
      slug: z.string(), // provider entity, more reliable provider_slug (foreign key)
    }),
    provider_display_name: z.string(),
    quantization: z.string().nullable(),
    variant: z.string(),

    max_prompt_tokens: z.number().nullable(),
    max_completion_tokens: z.number().nullable(),
    max_prompt_images: z.number().nullable(),
    max_tokens_per_image: z.number().nullable(),
    supported_parameters: z.array(z.string()),
    limit_rpm: z.number().nullable(),
    limit_rpd: z.number().nullable(),

    can_abort: z.boolean(),
    is_byok: z.boolean(),
    moderation_required: z.boolean(),
    supports_tool_parameters: z.boolean(),
    supports_reasoning: z.boolean(),
    supports_multipart: z.boolean(),
    has_completions: z.boolean(),
    has_chat_completions: z.boolean(),

    is_disabled: z.boolean(),
    status: z.number().optional(), // values below 0 indicate deranked

    variable_pricings: z.array(
      z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    ),

    pricing: z
      .object({
        prompt: z.coerce.number(),
        completion: z.coerce.number(),
        image: z.coerce.number(),
        request: z.coerce.number(),
        web_search: z.coerce.number(),
        input_cache_read: z.coerce.number().optional(),
        input_cache_write: z.coerce.number().optional(),
        internal_reasoning: z.coerce.number().optional(),
        discount: z.number(), // e.g. 0.25, already applied to the other pricing fields
      })
      .transform(R.pickBy(R.isTruthy)),

    stats: z
      .object({
        endpoint_id: z.string(), // uuid (same as id)
        p50_throughput: z.number(),
        p50_latency: z.number(),
        request_count: z.number(),
      })
      .optional(),

    data_policy: DataPolicy,
  })
  .transform(R.pickBy(R.isNonNullish))
  .transform((data) => {
    const endpoint = {
      uuid: data.id,
      model_variant: data.variant,

      provider_slug: data.provider_info.slug,
      provider_name: data.provider_display_name,

      name: data.name,
      context_length: data.context_length,
      quantization: data.quantization,
      supported_parameters: data.supported_parameters,

      capabilities: {
        completions: data.has_completions,
        chat_completions: data.has_chat_completions,
        reasoning: data.supports_reasoning,
        tools: data.supports_tool_parameters,
        multipart_messages: data.supports_multipart,
        stream_cancellation: data.can_abort,
        byok: data.is_byok,
      },

      limits: {
        input_tokens: data.max_prompt_tokens,
        output_tokens: data.max_completion_tokens,
        images_per_prompt: data.max_prompt_images,
        tokens_per_image: data.max_tokens_per_image,
        rpm: data.limit_rpm,
        rpd: data.limit_rpd,
      },

      data_policy: {
        training: data.data_policy.training,
        retains_prompts: data.data_policy.retainsPrompts,
        retention_days: data.data_policy.retentionDays,
        requires_user_ids: data.data_policy.requiresUserIDs,
        can_publish: data.data_policy.canPublish,
      },

      pricing: {
        input: data.pricing.prompt,
        output: data.pricing.completion,
        image_input: data.pricing.image,
        reasoning_output: data.pricing.internal_reasoning,
        web_search: data.pricing.web_search,
        cache_read: data.pricing.input_cache_read,
        cache_write: data.pricing.input_cache_write,
        per_request: data.pricing.request,
        discount: data.pricing.discount,
      },

      variable_pricings: data.variable_pricings,

      stats: data.stats
        ? {
            p50_throughput: data.stats.p50_throughput,
            p50_latency: data.stats.p50_latency,
            request_count: data.stats.request_count,
          }
        : undefined,

      status: data.status ?? 0,
      is_disabled: data.is_disabled,
      is_moderated: data.moderation_required,
    }

    return endpoint
  })
