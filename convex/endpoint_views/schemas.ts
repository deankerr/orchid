import z4 from 'zod/v4'
import * as R from 'remeda'

const dataPolicyFields = {
  termsOfServiceURL: z4.url().optional(),
  privacyPolicyURL: z4.url().optional(),
  dataPolicyUrl: z4.url().optional(),
  freeModels: z4
    .object({
      training: z4.boolean(),
      retainsPrompts: z4.boolean(),
      retentionDays: z4.number().optional(),
    })
    .optional(),
  paidModels: z4.object({
    training: z4.boolean(),
    retainsPrompts: z4.boolean().optional(),
    retentionDays: z4.number().optional(),
    requiresUserIDs: z4.boolean().optional(),
  }),
  training: z4.boolean().optional(),
  retainsPrompts: z4.boolean().optional(),
  retentionDays: z4.number().optional(),
  requiresUserIDs: z4.boolean().optional(),
}

const pricingFields = {
  prompt: z4.string(),
  completion: z4.string(),
  image: z4.string(),
  request: z4.string(),
  input_cache_read: z4.string().optional(),
  input_cache_write: z4.string().optional(),
  internal_reasoning: z4.string().optional(),

  web_search: z4.string(),
  discount: z4.number(),
}

const statsFields = {
  endpoint_id: z4.string(),
  p50_throughput: z4.number(),
  p50_latency: z4.number(),
  request_count: z4.number(),
}

const fields = {
  id: z4.string(),
  name: z4.string(),
  context_length: z4.number(),
  model: z4.unknown(), // NOTE: OpenRouterFrontendModelRecordSchema object
  model_variant_slug: z4.string(),
  model_variant_permaslug: z4.string(),
  provider_name: z4.string(),
  provider_info: z4.unknown(), // NOTE: OpenRouterFrontendProviderRecordSchema object
  provider_display_name: z4.string(),
  provider_slug: z4.string(),
  provider_model_id: z4.string(),
  provider_region: z4.string().nullable(),
  quantization: z4.string().nullable(),
  variant: z4.string(),
  is_free: z4.boolean(),
  can_abort: z4.boolean(),
  max_prompt_tokens: z4.number().nullable(),
  max_completion_tokens: z4.number().nullable(),
  max_prompt_images: z4.number().nullable(),
  max_tokens_per_image: z4.number().nullable(),
  supported_parameters: z4.array(z4.string()),
  is_byok: z4.boolean(),
  moderation_required: z4.boolean(),
  variable_pricings: z4.array(z4.record(z4.string(), z4.unknown())),
  is_hidden: z4.boolean(),
  is_deranked: z4.boolean(),
  is_disabled: z4.boolean(),
  supports_tool_parameters: z4.boolean(),
  supports_reasoning: z4.boolean(),
  supports_multipart: z4.boolean(),
  limit_rpm: z4.number().nullable(),
  limit_rpd: z4.number().nullable(),
  limit_rpm_cf: z4.number().nullable(),
  has_completions: z4.boolean(),
  has_chat_completions: z4.boolean(),
  features: z4
    .object({
      supported_parameters: z4
        .object({
          response_format: z4.boolean().optional(),
          structured_outputs: z4.boolean().optional(),
        })
        .strict()
        .optional(),
      supports_document_url: z4.null(),
    })
    .strict(),
  status: z4.number().optional(),
}

export const EndpointStrictSchema = z4.strictObject({
  ...fields,
  data_policy: z4.strictObject(dataPolicyFields),
  pricing: z4.strictObject({ ...pricingFields, discount: z4.literal(0) }),
  stats: z4.strictObject(statsFields),
})

export const EndpointTransformSchema = z4
  .object({
    ...R.omit(fields, [
      'model',
      'provider_info',
      'provider_model_id',
      'provider_region',
      'limit_rpm',
      'limit_rpd',
      'limit_rpm_cf',
      'features',
      'is_deranked',
      'is_hidden',
    ]),
    data_policy: z4.object(
      R.pick(dataPolicyFields, ['training', 'retainsPrompts', 'retentionDays', 'requiresUserIDs']),
    ),
    pricing: z4
      .object({
        prompt: z4.coerce.number(),
        completion: z4.coerce.number(),
        image: z4.coerce.number(),
        request: z4.coerce.number(),
        input_cache_read: z4.coerce.number().optional(),
        input_cache_write: z4.coerce.number().optional(),
        internal_reasoning: z4.coerce.number().optional(),
      })
      .transform(R.pickBy(R.isTruthy)),
    stats: z4.object(statsFields),
  })
  .transform(R.pickBy(R.isNonNullish))
  .transform((r) => {
    const endpoint = {
      uuid: r.id,
      model_variant: r.variant,

      provider_id: r.provider_slug,
      provider_name: r.provider_display_name,

      name: r.name,
      context_length: r.context_length,
      quantization: r.quantization,
      supported_parameters: r.supported_parameters,

      capabilities: {
        completions: r.has_completions,
        chat_completions: r.has_chat_completions,
        reasoning: r.supports_reasoning,
        tools: r.supports_tool_parameters,
        multipart_messages: r.supports_multipart,
        stream_cancellation: r.can_abort,
        byok: r.is_byok,
      },

      limits: {
        input_tokens: r.max_prompt_tokens,
        output_tokens: r.max_completion_tokens,
        images_per_prompt: r.max_prompt_images,
        tokens_per_image: r.max_tokens_per_image,
      },

      data_policy: {
        training: r.data_policy.training,
        retains_prompts: r.data_policy.retainsPrompts,
        retention_days: r.data_policy.retentionDays,
        requires_user_ids: r.data_policy.requiresUserIDs,
      },

      pricing: {
        input: r.pricing.prompt,
        output: r.pricing.completion,
        image_input: r.pricing.image,
        reasoning_output: r.pricing.internal_reasoning,
        cache_read: r.pricing.input_cache_read,
        cache_write: r.pricing.input_cache_write,
        per_request: r.pricing.request,
      },

      status: r.status ?? 0,
      is_disabled: r.is_disabled,
      is_moderated: r.moderation_required,
    }

    const stats = {
      endpoint_uuid: r.stats.endpoint_id,
      p50_throughput: r.stats.p50_throughput,
      p50_latency: r.stats.p50_latency,
      request_count: r.stats.request_count,
    }

    return { endpoint, stats }
  })
