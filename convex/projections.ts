import { z } from 'zod'
import type { ModelEndpointsPack } from './sync'
import { mutation, query } from './_generated/server'
import pako from 'pako'

const EndpointUptimeSchema = z
  .object({
    date: z.string(),
    uptime: z.number().nullable(),
  })
  .array()

const EndpointDataPolicySchema = z.object({
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

const EndpointPricingSchema = z.object({
  prompt: z.string(),
  completion: z.string(),
  image: z.string(),
  request: z.string(),
  input_cache_read: z.string().optional(),
  input_cache_write: z.string().optional(),
  internal_reasoning: z.string().optional(),
})

const EndpointStatsSchema = z.object({
  p50_throughput: z.number(),
  p50_latency: z.number(),
  request_count: z.number(),
})

export const EndpointSchema = z.object({
  id: z.string(),
  name: z.string(),
  context_length: z.number(), // occasionally varies from the model.context_length
  model_variant_slug: z.string(), // model.id - keep for parsing but don't use in projection
  model_variant_permaslug: z.string(), // versioned model id - keep for parsing but don't use in projection
  provider_name: z.string(),
  provider_display_name: z.string(),
  provider_slug: z.string(),
  provider_model_id: z.string(), // provider's id for this model
  quantization: z.string().nullable(),
  variant: z.string(), // standard | free | thinking | extended etc.
  is_free: z.boolean(),
  can_abort: z.boolean(),
  max_prompt_tokens: z.number().nullable(),
  max_completion_tokens: z.number().nullable(),
  max_prompt_images: z.number().nullable(),
  max_tokens_per_image: z.number().nullable(),
  supported_parameters: z.array(z.string()),
  is_byok: z.boolean(),
  moderation_required: z.boolean(),
  data_policy: EndpointDataPolicySchema,
  pricing: EndpointPricingSchema,
  variable_pricings: z.array(z.record(z.unknown())), // used for gemini, gpt/perplexity web search etc
  is_deranked: z.boolean(),
  is_disabled: z.boolean(),
  supports_tool_parameters: z.boolean(),
  supports_reasoning: z.boolean(),
  supports_multipart: z.boolean(), // allows text/images etc. in a single message
  limit_rpm: z.number().nullable(),
  limit_rpd: z.number().nullable(),
  limit_rpm_cf: z.number().nullable(),
  has_completions: z.boolean(),
  has_chat_completions: z.boolean(),
  provider_region: z.string().nullable(),
  stats: EndpointStatsSchema.optional(),
  status: z.number().optional(), // 0 = ok, can decrease to indicate issues. missing = ???
})

const ReasoningConfigSchema = z.object({
  start_token: z.string(),
  end_token: z.string(),
})

export const ModelSchema = z.object({
  id: z.string(), // unique id that we added
  slug: z.string(), // variants share this value, not a unique id - keep for parsing but don't use in projection
  hf_slug: z.string().nullable(),
  updated_at: z.string(), // ex. "2025-03-28T03:20:30.853469+00:00"
  created_at: z.string(), // ex. "2025-03-26T18:42:53.41832+00:00"
  name: z.string(), // display name
  short_name: z.string(), // display name without author display name?
  author: z.string(),
  description: z.string(),
  model_version_group_id: z.string().nullable(), // ?
  context_length: z.number(),
  input_modalities: z.array(z.string()), // may indicate that the model supports image/file inputs
  output_modalities: z.array(z.string()), // always 'text'
  group: z.string(), // ?
  instruct_type: z.string().nullable(),
  warning_message: z.string().nullable(),
  permaslug: z.string(), // versioned id - keep for parsing but don't use in projection
  reasoning_config: ReasoningConfigSchema.nullable(),
})

function processModelEnpoints(modelEndpoints: ModelEndpointsPack) {
  const modelParse = ModelSchema.safeParse(modelEndpoints.model)
  if (!modelParse.success) {
    console.warn('processModelEnpoints: invalid model payload', modelParse.error)
    return { model: null, endpoints: [] }
  }

  const rawModel = modelParse.data
  const supportsImages = rawModel.input_modalities.includes('image')
  const supportsFiles = rawModel.input_modalities.includes('file')

  // Normalized model projection with clustered properties
  const model = {
    // Identity - use id as primary key, keep hfSlug for reference
    id: rawModel.id,
    hfSlug: rawModel.hf_slug,

    // Display
    name: rawModel.name,
    shortName: rawModel.short_name,
    author: rawModel.author,
    description: rawModel.description,
    group: rawModel.group,
    warningMessage: rawModel.warning_message,

    // Timestamps
    createdAt: rawModel.created_at,
    updatedAt: rawModel.updated_at,

    // Capabilities
    contextLength: rawModel.context_length,
    inputModalities: rawModel.input_modalities,
    outputModalities: rawModel.output_modalities,
    supportsImages,
    supportsFiles,

    // Technical
    instructType: rawModel.instruct_type,
    reasoningConfig: rawModel.reasoning_config,
    modelVersionGroupId: rawModel.model_version_group_id,
  }

  // Process endpoints with inherited capabilities
  const endpoints: Array<{
    // Identity
    id: string // endpoint uuid
    name: string
    modelId: string // references model.id

    // Provider
    providerName: string
    providerDisplayName: string
    providerSlug: string
    providerModelId: string
    providerRegion: string | null

    // Variant & Config
    variant: string
    quantization: string | null
    contextLength: number

    // Capabilities (inherited + endpoint-specific)
    supportsImages: boolean
    supportsFiles: boolean
    supportsToolParameters: boolean
    supportsReasoning: boolean
    supportsMultipart: boolean
    hasCompletions: boolean
    hasChatCompletions: boolean

    // Limits & Constraints
    maxPromptTokens: number | null
    maxCompletionTokens: number | null
    maxPromptImages: number | null
    maxTokensPerImage: number | null
    limitRpm: number | null
    limitRpd: number | null
    limitRpmCf: number | null

    // Pricing & Business
    isFree: boolean
    isByok: boolean
    pricing: z.infer<typeof EndpointPricingSchema>
    variablePricings: Array<Record<string, unknown>>

    // Status & Availability
    isDeranked: boolean
    status?: number

    // Technical Features
    canAbort: boolean
    moderationRequired: boolean
    supportedParameters: string[]

    // Data Policy & Stats
    dataPolicy: z.infer<typeof EndpointDataPolicySchema>
    stats?: z.infer<typeof EndpointStatsSchema>
    uptime?: z.infer<typeof EndpointUptimeSchema>
  }> = []

  if (Array.isArray(modelEndpoints.endpoints)) {
    for (const epRaw of modelEndpoints.endpoints) {
      const epParse = EndpointSchema.safeParse(epRaw)
      if (!epParse.success) {
        console.warn('processModelEnpoints: invalid endpoint payload', epParse.error)
        continue
      }

      if (epParse.data.is_disabled) {
        continue
      }

      const uptime = EndpointUptimeSchema.safeParse(modelEndpoints.uptimes[epParse.data.id])
      if (!uptime.success) {
        console.warn('processModelEnpoints: invalid uptime payload', uptime.error)
      }

      const ep = epParse.data
      endpoints.push({
        // Identity
        id: ep.id,
        name: ep.name,
        modelId: rawModel.id, // Use the model's id as the reference

        // Provider
        providerName: ep.provider_name,
        providerDisplayName: ep.provider_display_name,
        providerSlug: ep.provider_slug,
        providerModelId: ep.provider_model_id,
        providerRegion: ep.provider_region,

        // Variant & Config
        variant: ep.variant,
        quantization: ep.quantization,
        contextLength: ep.context_length,

        // Capabilities (inherited + endpoint-specific)
        supportsImages,
        supportsFiles,
        supportsToolParameters: ep.supports_tool_parameters,
        supportsReasoning: ep.supports_reasoning,
        supportsMultipart: ep.supports_multipart,
        hasCompletions: ep.has_completions,
        hasChatCompletions: ep.has_chat_completions,

        // Limits & Constraints
        maxPromptTokens: ep.max_prompt_tokens,
        maxCompletionTokens: ep.max_completion_tokens,
        maxPromptImages: ep.max_prompt_images,
        maxTokensPerImage: ep.max_tokens_per_image,
        limitRpm: ep.limit_rpm,
        limitRpd: ep.limit_rpd,
        limitRpmCf: ep.limit_rpm_cf,

        // Pricing & Business
        isFree: ep.is_free,
        isByok: ep.is_byok,
        pricing: ep.pricing,
        variablePricings: ep.variable_pricings,

        // Status & Availability
        isDeranked: ep.is_deranked,
        status: ep.status,

        // Technical Features
        canAbort: ep.can_abort,
        moderationRequired: ep.moderation_required,
        supportedParameters: ep.supported_parameters,

        // Data Policy & Stats
        dataPolicy: ep.data_policy,
        stats: ep.stats,
        uptime: uptime.data,
      })
    }
  }

  return { model, endpoints }
}

export const processLatestSnapshot = mutation({
  handler: async (ctx) => {
    // Get the latest model_endpoints snapshot
    const snapshot = await ctx.db
      .query('snapshots')
      .withIndex('by_category', (q) => q.eq('category', 'model_endpoints'))
      .order('desc')
      .first()

    if (!snapshot) {
      throw new Error('No model endpoints snapshot found')
    }

    // Decompress and parse the snapshot data
    const snapshotData: { all: ModelEndpointsPack[] } = JSON.parse(
      pako.inflate(snapshot.data, { to: 'string' }),
    )

    // Clear existing processed data
    const existing = await ctx.db.query('meps').collect()
    for (const record of existing) {
      await ctx.db.delete(record._id)
    }

    // Process each ModelEndpointsPack and insert results
    for (const pack of snapshotData.all) {
      const { model, endpoints } = processModelEnpoints(pack)

      if (model) {
        await ctx.db.insert('meps', {
          model,
          endpoints,
        })
      }
    }

    return { processed: snapshotData.all.length }
  },
})

export const getAllProcessedData = query({
  handler: async (ctx) => {
    return await ctx.db.query('meps').collect()
  },
})
