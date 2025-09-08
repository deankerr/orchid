import * as R from 'remeda'
import { z } from 'zod'

import type { CrawlArchiveBundle } from '../crawl'
import { ModelTransformSchema } from './models'
import { ProviderTransformSchema } from './providers'

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
    quantization: z.string().nullable(),
    variant: z.string(),
    is_free: z.boolean(),
    can_abort: z.boolean(),
    max_prompt_tokens: z.number().nullable(),
    max_completion_tokens: z.number().nullable(),
    max_prompt_images: z.number().nullable(),
    max_tokens_per_image: z.number().nullable(),
    supported_parameters: z.array(z.string()),
    moderation_required: z.boolean(),
    data_policy: z.object({
      training: z.boolean(),
      retainsPrompts: z.boolean(),
      canPublish: z.boolean(),
      retentionDays: z.number().optional(),
      requiresUserIDs: z.boolean().optional(),
    }),
    pricing: z.object({
      prompt: z.coerce.string(),
      completion: z.coerce.string(),
      image: z.coerce.string(),
      image_output: z.coerce.string(),
      request: z.coerce.string(),
      web_search: z.coerce.string(),
      internal_reasoning: z.coerce.string(),
      input_cache_read: z.coerce.string().optional(),
      input_cache_write: z.coerce.string().optional(),
      audio: z.coerce.string().optional(),
      input_audio_cache: z.coerce.string().optional(),
      discount: z.number(),
    }),
    is_deranked: z.boolean(),
    is_disabled: z.boolean(),
    supports_tool_parameters: z.boolean(),
    supports_reasoning: z.boolean(),
    supports_multipart: z.boolean(),

    limit_rpm: z.number().nullable(),
    limit_rpd: z.number().nullable(),

    has_completions: z.boolean(),
    has_chat_completions: z.boolean(),
    features: z.object({
      supports_input_audio: z.boolean().optional(),
      supports_tool_choice: z.object({
        literal_none: z.boolean(),
        literal_auto: z.boolean(),
        literal_required: z.boolean(),
        type_function: z.boolean(),
      }),
      supported_parameters: z
        .object({
          response_format: z.boolean().optional(),
          structured_outputs: z.boolean().optional(),
        })
        .optional(),
      is_mandatory_reasoning: z.boolean().optional(),
      supports_implicit_caching: z.boolean().optional(),
      supports_multipart: z.boolean().optional(),
      supports_file_urls: z.boolean().optional(),
      supports_native_web_search: z.boolean().optional(),
    }),
    provider_region: z.string().nullable(),
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

      // * provider identity
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
        text_input: parseFloat(raw.pricing.prompt) || undefined,
        text_output: parseFloat(raw.pricing.completion) || undefined,
        internal_reasoning: parseFloat(raw.pricing.internal_reasoning) || undefined,
        audio_input: raw.pricing.audio ? parseFloat(raw.pricing.audio) : undefined,
        audio_cache_input: raw.pricing.input_audio_cache
          ? parseFloat(raw.pricing.input_audio_cache)
          : undefined,
        cache_read: raw.pricing.input_cache_read
          ? parseFloat(raw.pricing.input_cache_read)
          : undefined,
        cache_write: raw.pricing.input_cache_write
          ? parseFloat(raw.pricing.input_cache_write)
          : undefined,
        image_input: parseFloat(raw.pricing.image) || undefined,
        image_output: parseFloat(raw.pricing.image_output) || undefined,
        request: parseFloat(raw.pricing.request) || undefined,
        web_search: parseFloat(raw.pricing.web_search) || undefined,
        discount: raw.pricing.discount || undefined,
      },

      // * limits
      limits: {
        text_input_tokens: raw.max_prompt_tokens || undefined,
        text_output_tokens: raw.max_completion_tokens || undefined,
        image_input_tokens: raw.max_tokens_per_image || undefined,
        images_per_input: raw.max_prompt_images || undefined,
        requests_per_minute: raw.limit_rpm || undefined,
        requests_per_day: raw.limit_rpd || undefined,
      },

      // * endpoint configuration
      context_length: raw.context_length,
      quantization: raw.quantization || undefined,
      supported_parameters: raw.supported_parameters,

      // * endpoint capability
      completions: raw.has_completions,
      chat_completions: raw.has_chat_completions,
      stream_cancellation: raw.can_abort,
      implicit_caching: raw.features.supports_implicit_caching || false,
      file_urls: raw.features.supports_file_urls || false,
      native_web_search: raw.features.supports_native_web_search || false,
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
  const parsed = rawEndpoints.map((raw) => ModelEndpointTransformSchema.safeParse(raw))

  const issues = parsed.filter((p) => !p.success).map((p) => z.prettifyError(p.error))
  if (issues.length) console.error('[materialize_v2:endpoints]', { issues })

  return parsed.filter((p) => p.success).map((p) => p.data)
}
