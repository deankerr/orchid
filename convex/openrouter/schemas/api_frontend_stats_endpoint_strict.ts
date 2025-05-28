import { z } from 'zod'

// NOTE: May be the same as ProviderDataPolicySchema
const DataPolicySchemaStrict = z
  .object({
    termsOfServiceURL: z.string().url().optional(),
    privacyPolicyURL: z.string().url().optional(),
    dataPolicyUrl: z.string().url().optional(),
    freeModels: z
      .object({
        training: z.boolean(),
        retainsPrompts: z.boolean(),
        retentionDays: z.number().optional(),
      })
      .strict()
      .optional(),
    paidModels: z
      .object({
        training: z.boolean(),
        retainsPrompts: z.boolean().optional(),
        retentionDays: z.number().optional(),
        requiresUserIDs: z.boolean().optional(),
      })
      .strict(),
    training: z.boolean().optional(),
    retainsPrompts: z.boolean().optional(),
    retentionDays: z.number().optional(),
    requiresUserIDs: z.boolean().optional(),
  })
  .strict()

const PricingSchemaStrict = z
  .object({
    prompt: z.string(),
    completion: z.string(),
    image: z.string(),
    request: z.string(),
    web_search: z.string(),
    input_cache_read: z.string().optional(),
    input_cache_write: z.string().optional(),
    internal_reasoning: z.string().optional(),
    discount: z.number(),
  })
  .strict()

const StatsSchemaStrict = z
  .object({
    endpoint_id: z.string(),
    p50_throughput: z.number(),
    p50_latency: z.number(),
    request_count: z.number(),
  })
  .strict()

const OpenRouterFrontendEndpointRecordSchemaStrict = z
  .object({
    id: z.string(),
    name: z.string(),
    context_length: z.number(),
    model: z.unknown(), // NOTE: OpenRouterFrontendModelRecordSchema object
    model_variant_slug: z.string(),
    model_variant_permaslug: z.string(),
    provider_name: z.string(),
    provider_info: z.unknown(), // NOTE: OpenRouterFrontendProviderRecordSchema object
    provider_display_name: z.string(),
    provider_slug: z.string(),
    provider_model_id: z.string(),
    provider_region: z.string().nullable(),
    quantization: z.string().nullable(),
    variant: z.string(),
    is_free: z.boolean(),
    can_abort: z.boolean(),
    max_prompt_tokens: z.number().nullable(),
    max_completion_tokens: z.number().nullable(),
    max_prompt_images: z.number().nullable(),
    max_tokens_per_image: z.number().nullable(),
    supported_parameters: z.array(z.string()),
    is_byok: z.boolean(),
    moderation_required: z.boolean(),
    data_policy: DataPolicySchemaStrict,
    pricing: PricingSchemaStrict,
    variable_pricings: z.array(z.record(z.unknown())),
    is_hidden: z.boolean(),
    is_deranked: z.boolean(),
    is_disabled: z.boolean(),
    supports_tool_parameters: z.boolean(),
    supports_reasoning: z.boolean(),
    supports_multipart: z.boolean(),
    limit_rpm: z.number().nullable(),
    limit_rpd: z.number().nullable(),
    limit_rpm_cf: z.number().nullable(),
    has_completions: z.boolean(),
    has_chat_completions: z.boolean(),
    features: z
      .object({
        supported_parameters: z
          .object({
            response_format: z.boolean().optional(),
            structured_outputs: z.boolean().optional(),
          })
          .strict()
          .optional(),
        supports_document_url: z.null(),
      })
      .strict(),
    stats: StatsSchemaStrict.optional(),
    status: z.number().optional(),
  })
  .strict()
