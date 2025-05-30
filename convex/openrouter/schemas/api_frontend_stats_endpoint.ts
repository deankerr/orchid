import { z } from 'zod'

const DataPolicySchema = z.object({
  termsOfServiceURL: z.string().url().optional(),
  privacyPolicyURL: z.string().url().optional(),
  dataPolicyUrl: z.string().url().optional(),
  freeModels: z
    .object({
      training: z.boolean(),
      retainsPrompts: z.boolean(),
      retentionDays: z.number().optional(),
    })

    .optional(),
  paidModels: z.object({
    training: z.boolean(),
    retainsPrompts: z.boolean().optional(),
    retentionDays: z.number().optional(),
    requiresUserIDs: z.boolean().optional(),
  }),
  training: z.boolean().optional(),
  retainsPrompts: z.boolean().optional(),
  retentionDays: z.number().optional(),
  requiresUserIDs: z.boolean().optional(),
})

const PricingSchema = z.object({
  prompt: z.string(),
  completion: z.string(),
  image: z.string(),
  request: z.string(),
  input_cache_read: z.string().optional(),
  input_cache_write: z.string().optional(),
  internal_reasoning: z.string().optional(),
})

const StatsSchema = z.object({
  p50_throughput: z.number(),
  p50_latency: z.number(),
  request_count: z.number(),
})

export const OpenRouterFrontendEndpointRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  context_length: z.number(),
  model_variant_slug: z.string(),
  model_variant_permaslug: z.string(),
  provider_display_name: z.string(),
  provider_slug: z.string(),
  provider_region: z.string().nullable(),
  quantization: z.string().nullable(),
  variant: z.string(),
  can_abort: z.boolean(),
  max_prompt_tokens: z.number().nullable(),
  max_completion_tokens: z.number().nullable(),
  max_prompt_images: z.number().nullable(),
  max_tokens_per_image: z.number().nullable(),
  supported_parameters: z.array(z.string()),
  is_byok: z.boolean(),
  moderation_required: z.boolean(),
  data_policy: DataPolicySchema,
  pricing: PricingSchema,
  variable_pricings: z.array(z.record(z.unknown())),
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
  stats: StatsSchema.optional(),
  status: z.number().optional(),
})
