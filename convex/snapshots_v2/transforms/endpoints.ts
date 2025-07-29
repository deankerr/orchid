import * as R from 'remeda'
import z4 from 'zod/v4'

import { DataPolicySchemas } from '@/convex/openrouter/validators/dataPolicy'

export const endpoints = z4
  .object({
    id: z4.string(), // primary key, uuid
    name: z4.string(), // internal id, `{provider_name} | {model_variant_slug}`
    context_length: z4.number(),
    model_variant_slug: z4.string(), // {slug}:{variant}
    model_variant_permaslug: z4.string(), // {permaslug}:{variant}
    provider_name: z4.string(), // foreign internal id
    provider_info: z4.object({
      slug: z4.string(), // provider entity, more reliable provider_slug (foreign key)
    }),
    provider_display_name: z4.string(),
    quantization: z4.string().nullable(),
    variant: z4.string(),

    max_prompt_tokens: z4.number().nullable(),
    max_completion_tokens: z4.number().nullable(),
    max_prompt_images: z4.number().nullable(),
    max_tokens_per_image: z4.number().nullable(),
    supported_parameters: z4.array(z4.string()),
    limit_rpm: z4.number().nullable(),
    limit_rpd: z4.number().nullable(),

    can_abort: z4.boolean(),
    is_byok: z4.boolean(),
    moderation_required: z4.boolean(),
    supports_tool_parameters: z4.boolean(),
    supports_reasoning: z4.boolean(),
    supports_multipart: z4.boolean(),
    has_completions: z4.boolean(),
    has_chat_completions: z4.boolean(),

    is_disabled: z4.boolean(),
    status: z4.number().optional(), // values below 0 indicate deranked

    variable_pricings: z4.array(
      z4.record(z4.string(), z4.union([z4.string(), z4.number(), z4.boolean()])),
    ),

    pricing: z4
      .object({
        prompt: z4.coerce.number(),
        completion: z4.coerce.number(),
        image: z4.coerce.number(),
        request: z4.coerce.number(),
        web_search: z4.coerce.number(),
        input_cache_read: z4.coerce.number().optional(),
        input_cache_write: z4.coerce.number().optional(),
        internal_reasoning: z4.coerce.number().optional(),
        discount: z4.number(), // e.g. 0.25, already applied to the other pricing fields
      })
      .transform(R.pickBy(R.isTruthy)),

    stats: z4
      .object({
        endpoint_id: z4.string(), // uuid (same as id)
        p50_throughput: z4.number(),
        p50_latency: z4.number(),
        request_count: z4.number(),
      })
      .optional(),

    data_policy: DataPolicySchemas.endpoint.transform,
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
