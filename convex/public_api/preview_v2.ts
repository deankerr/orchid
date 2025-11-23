import { api } from '../_generated/api'
import { ActionCtx } from '../_generated/server'

function formatPrice(price: number | undefined): string | null {
  if (!price) return null
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
  })
}

export async function previewV2HttpHandler(ctx: ActionCtx) {
  const endpointsList = await ctx
    .runQuery(api.endpoints.list, { maxTimeUnavailable: 0 })
    .then((list) => list.filter((e) => !e.disabled))

  const models = Map.groupBy(endpointsList, (e) => e.model.slug)
    .values()
    .map((group) => {
      const model = group[0].model
      const endpoints = group.map((endpoint) => {
        const data_policy = {
          may_publish_data: endpoint.data_policy.can_publish ?? false,
          may_retain_data: endpoint.data_policy.retains_prompts ?? false,
          data_retention_days: endpoint.data_policy.retains_prompts_days ?? null,
          may_train_on_data: endpoint.data_policy.training ?? false,
          shares_user_id: endpoint.data_policy.requires_user_ids ?? false,
        }

        const pricingTiers =
          endpoint.variable_pricings?.map((tier) => ({
            tokens: tier.threshold,
            text_input: formatPrice(tier.text_input),
            text_output: formatPrice(tier.text_output),
            text_cache_read: formatPrice(tier.cache_read),
            text_cache_write: formatPrice(tier.cache_write),
          })) ?? []

        const pricing = {
          text_input: formatPrice(endpoint.pricing.text_input),
          text_output: formatPrice(endpoint.pricing.text_output),
          image_input: formatPrice(endpoint.pricing.image_input),
          image_output: formatPrice(endpoint.pricing.image_output),
          audio_input: formatPrice(endpoint.pricing.audio_input),
          audio_cache_write: formatPrice(endpoint.pricing.audio_cache_input),
          text_cache_read: formatPrice(endpoint.pricing.cache_read),
          text_cache_write: formatPrice(endpoint.pricing.cache_write),
          reasoning_output: formatPrice(endpoint.pricing.internal_reasoning),
          per_request: formatPrice(endpoint.pricing.request),
          // web_search: formatPrice(endpoint.pricing.web_search), // NOTE: unreliable?

          tiers: pricingTiers.length > 0 ? pricingTiers : null,
        }

        const limits = {
          text_input_tokens: endpoint.limits?.text_input_tokens ?? null,
          text_output_tokens: endpoint.limits?.text_output_tokens ?? null,
          image_input_tokens: endpoint.limits?.image_input_tokens ?? null,
          images_per_input: endpoint.limits?.images_per_input ?? null,
          requests_per_minute: endpoint.limits?.requests_per_minute ?? null,
          requests_per_day: endpoint.limits?.requests_per_day ?? null,
        }

        return {
          provider_id: endpoint.provider.tag_slug,
          provider_name: endpoint.provider.name,
          provider_region: endpoint.provider.region ?? null,
          context_length: endpoint.context_length,
          pricing,
          supported_parameters: endpoint.supported_parameters,
          quantization: endpoint.quantization ?? 'unknown',
          data_policy,
          limits,
          completions: endpoint.completions,
          chat_completions: endpoint.chat_completions,
          deranked: endpoint.deranked,
          implicit_caching: endpoint.implicit_caching,
          moderated: endpoint.moderated,
          // mandatory_reasoning: endpoint.mandatory_reasoning, // NOTE: currently too unreliable
          native_web_search: endpoint.native_web_search,
          // TODO: zdr
        }
      })

      return {
        id: model.slug,
        version_id: model.version_slug,
        name: model.name,
        author_name: model.author_name,
        variant: model.variant,
        created_at: new Date(model.or_added_at).toISOString(),
        input_modalities: model.input_modalities,
        output_modalities: model.output_modalities,
        reasoning: model.reasoning,
        // more user-friendly name for these
        providers: endpoints,
      }
    })
    .toArray()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const result = {
    updated_at: new Date(
      endpointsList.reduce((max, e) => Math.max(max, e.updated_at), 0),
    ).toISOString(),
    models,
  }

  return result
}
