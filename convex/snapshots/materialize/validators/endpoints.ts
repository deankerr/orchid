import * as R from 'remeda'
import { z } from 'zod'

import { ModelTransformSchema } from './models'
import { ProviderTransformSchema } from './providers'

const zPrice = z.coerce
  .number()
  .transform((val) => (val !== 0 ? val : undefined))
  .optional()

export const EndpointTransformSchema = z
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
      training: z.boolean().optional(),
      retainsPrompts: z.boolean().optional(),
      canPublish: z.boolean().optional(),
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

    stats: z
      .object({
        p50_throughput: z.number(),
        p50_latency: z.number(),
      })
      .optional(),
  })
  .transform(R.pickBy(R.isNonNullish))
  .transform((raw) => {
    // enrich model with data only available on model endpoints
    const model = {
      ...raw.model,
      slug: raw.model_variant_slug,
      variant: raw.variant,
      reasoning: raw.supports_reasoning,
      mandatory_reasoning: raw.features.is_mandatory_reasoning || false,
      // add variant suffix to name
      name:
        raw.variant === 'beta'
          ? `${raw.model.name} (self-moderated)` // anthropic only, match name on OR
          : raw.variant !== 'standard'
            ? `${raw.model.name} (${raw.variant})`
            : raw.model.name,
    }

    const provider = {
      ...raw.provider_info,
      // remove tag suffix if present
      slug: raw.provider_slug.split('/')[0],
    }

    const endpoint = {
      uuid: raw.id,

      // * model
      model: R.pick(model, [
        'author_name',
        'author_slug',
        'base_slug',
        'icon_url',
        'input_modalities',
        'mandatory_reasoning',
        'name',
        'or_added_at',
        'output_modalities',
        'reasoning',
        'slug',
        'variant',
        'version_slug',
      ]),

      // * provider
      provider: {
        slug: provider.slug,
        name: provider.name,
        icon_url: provider.icon_url,
        // endpoint specific
        tag_slug: raw.provider_slug,
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

      // * stats
      stats: raw.stats,
    }

    return { model, endpoint, provider }
  })
