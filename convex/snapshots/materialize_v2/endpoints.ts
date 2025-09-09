import { type Infer } from 'convex/values'
import * as R from 'remeda'
import { z } from 'zod'

import * as DB from '@/convex/db'

import type { CrawlArchiveBundle } from '../crawl'
import { ModelTransformSchema } from './models'
import { ProviderTransformSchema } from './providers'

type VModel = Infer<typeof DB.OrViewsModels.vTable.validator>
type VEndpoint = Infer<typeof DB.OrViewsEndpoints.vTable.validator>

const zPrice = z.coerce
  .number()
  .transform((val) => (val !== 0 ? val : undefined))
  .optional()

const ModelEndpointTransformSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    context_length: z.number(),
    model: ModelTransformSchema,
    model_variant_slug: z.string(),

    provider_name: z.string(),
    provider_info: ProviderTransformSchema,
    provider_display_name: z.string(),
    provider_slug: z.string(),
    provider_model_id: z.string(),
    provider_region: z.string().nullable(),

    max_prompt_tokens: z.number().nullable(),
    max_completion_tokens: z.number().nullable(),
    max_prompt_images: z.number().nullable(),
    max_tokens_per_image: z.number().nullable(),
    limit_rpm: z.number().nullable(),
    limit_rpd: z.number().nullable(),

    variant: z.string(),
    quantization: z.string().nullable(),
    supported_parameters: z.array(z.string()),

    data_policy: z.object({
      training: z.boolean(),
      retainsPrompts: z.boolean(),
      canPublish: z.boolean(),
      retentionDays: z.number().optional(),
      requiresUserIDs: z.boolean().optional(),
    }),

    pricing: z.object({
      prompt: zPrice,
      completion: zPrice,
      image: zPrice,
      image_output: zPrice,
      request: zPrice,
      web_search: zPrice,
      internal_reasoning: zPrice,
      input_cache_read: zPrice,
      input_cache_write: zPrice,
      audio: zPrice,
      input_audio_cache: zPrice,
      discount: zPrice,
    }),

    can_abort: z.boolean(),
    has_completions: z.boolean(),
    has_chat_completions: z.boolean(),
    supports_tool_parameters: z.boolean(),
    supports_reasoning: z.boolean(),
    supports_multipart: z.boolean(),

    features: z.object({
      is_mandatory_reasoning: z.coerce.boolean(),
      supports_implicit_caching: z.coerce.boolean(),
      supports_file_urls: z.coerce.boolean(),
      supports_native_web_search: z.coerce.boolean(),
    }),

    moderation_required: z.boolean(),
    is_deranked: z.boolean(),
    is_disabled: z.boolean(),

    status: z.number().optional(),
  })
  .transform(R.pickBy(R.isNonNullish))
  .transform((raw) => {
    const model = {
      ...raw.model,
      slug: raw.model_variant_slug,
      variant: raw.variant,
      reasoning: raw.supports_reasoning,
      mandatory_reasoning: raw.features.is_mandatory_reasoning || false,
    }

    const endpoint = {
      uuid: raw.id,

      // * model
      model: R.omit(model, [
        'description',
        'hugging_face_id',
        'instruct_type',
        'tokenizer',
        'warning_message',
        'updated_at',
      ]),

      // * provider
      provider: {
        slug: raw.provider_slug.split('/')[0] || raw.provider_slug,
        tag_slug: raw.provider_slug,
        name: raw.provider_display_name,
        icon_url: raw.provider_info.icon_url,
        model_id: raw.provider_model_id,
        region: raw.provider_region,
      },

      // * data policy
      data_policy: {
        training: raw.data_policy.training,
        can_publish: raw.data_policy.canPublish,
        requires_user_ids: raw.data_policy.requiresUserIDs,

        retains_prompts: raw.data_policy.retainsPrompts,
        retains_prompts_days: raw.data_policy.retentionDays,
      },

      // * pricing
      pricing: {
        text_input: raw.pricing.prompt,
        text_output: raw.pricing.completion,
        internal_reasoning: raw.pricing.internal_reasoning,
        audio_input: raw.pricing.audio,
        audio_cache_input: raw.pricing.input_audio_cache,
        cache_read: raw.pricing.input_cache_read,
        cache_write: raw.pricing.input_cache_write,
        image_input: raw.pricing.image,
        image_output: raw.pricing.image_output,
        request: raw.pricing.request,
        web_search: raw.pricing.web_search,
        discount: raw.pricing.discount,
      },

      // * limits
      limits: {
        text_input_tokens: raw.max_prompt_tokens,
        text_output_tokens: raw.max_completion_tokens,
        image_input_tokens: raw.max_tokens_per_image,
        images_per_input: raw.max_prompt_images,
        requests_per_minute: raw.limit_rpm,
        requests_per_day: raw.limit_rpd,
      },

      // * endpoint configuration
      context_length: raw.context_length,
      quantization: raw.quantization,
      supported_parameters: raw.supported_parameters,

      // * endpoint capability
      completions: raw.has_completions,
      chat_completions: raw.has_chat_completions,
      stream_cancellation: raw.can_abort,
      implicit_caching: raw.features.supports_implicit_caching,
      file_urls: raw.features.supports_file_urls,
      native_web_search: raw.features.supports_native_web_search,
      multipart: raw.supports_multipart,

      // * openrouter
      moderated: raw.moderation_required,
      deranked: raw.is_deranked,
      disabled: raw.is_disabled,
      status: raw.status || 0,

      updated_at: Date.now(),
    }

    return { model, endpoint }
  })

export function materializeModelEndpoints(bundle: CrawlArchiveBundle) {
  const rawEndpoints = bundle.data.models.flatMap((m) => m.endpoints)

  const modelsMap = new Map<string, VModel>()
  const endpointsMap = new Map<string, VEndpoint>()
  const issues: string[] = []

  for (const raw of rawEndpoints) {
    const parsed = ModelEndpointTransformSchema.safeParse(raw)

    if (!parsed.success) {
      issues.push(z.prettifyError(parsed.error))
      continue
    }

    const { model, endpoint } = parsed.data
    modelsMap.set(model.slug, model)
    endpointsMap.set(endpoint.uuid, endpoint)
  }

  if (issues.length) console.error('[materialize_v2:endpoints]', { issues })

  return {
    models: Array.from(modelsMap.values()),
    endpoints: Array.from(endpointsMap.values()),
  }
}
