import { useMemo } from 'react'

import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import ms from 'ms'

import { api } from '@/convex/_generated/api'
import { Doc } from '@/convex/_generated/dataModel'

import { attributes } from '@/lib/attributes'

import { useEndpointFilters } from './use-endpoint-filters'

export function useEndpointsData() {
  const { data: rawEndpoints, isPending } = useQuery(
    convexQuery(api.endpoints.list, { maxTimeUnavailable: ms('30d') }),
  )

  const { attributeFilters } = useEndpointFilters()

  const filteredEndpoints = useMemo(() => {
    if (!rawEndpoints) return []

    const filtered = rawEndpoints.filter((endpoint) => {
      for (const [filterName, mode] of Object.entries(attributeFilters)) {
        let hasAttribute = false

        // Handle modality filters
        if (filterName === 'image_input') {
          hasAttribute = endpoint.model.input_modalities.includes('image')
        } else if (filterName === 'file_input') {
          hasAttribute = endpoint.model.input_modalities.includes('file')
        } else if (filterName === 'audio_input') {
          hasAttribute = endpoint.model.input_modalities.includes('audio')
        } else if (filterName === 'image_output') {
          hasAttribute = endpoint.model.output_modalities.includes('image')
        } else {
          // Handle regular attribute filters
          const attr = attributes[filterName as keyof typeof attributes]
          if (attr) {
            hasAttribute = attr.has(endpoint)
          }
        }

        if (mode === 'include' && !hasAttribute) {
          return false
        }
        if (mode === 'exclude' && hasAttribute) {
          return false
        }
      }

      return true
    })

    // Inject fake endpoint in development
    if (process.env.NODE_ENV === 'development') {
      return [FAKE_ENDPOINT, ...filtered]
    }

    return filtered
  }, [rawEndpoints, attributeFilters])

  return {
    rawEndpoints: rawEndpoints ?? [],
    filteredEndpoints,
    isLoading: isPending,
  }
}

export const FAKE_ENDPOINT: Doc<'or_views_endpoints'> = {
  _id: '__fake__' as any,
  _creationTime: Date.now(),
  uuid: 'fake-endpoint-uuid',
  model: {
    slug: 'orchid/fake-model',
    base_slug: 'orchid/fake-model',
    version_slug: 'orchid/fake-model',
    variant: 'free',
    name: '🌺 ORCHID Test Model',
    icon_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=orchid',
    author_slug: 'orchid',
    author_name: 'ORCHID',
    or_added_at: Date.now(),
    input_modalities: ['text', 'image', 'file', 'audio'],
    output_modalities: ['text', 'image'],
    reasoning: true,
  },
  provider: {
    slug: 'orchid',
    tag_slug: 'orchid',
    name: 'ORCHID Test Provider',
    icon_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=provider',
    model_id: 'orchid/fake-model',
  },
  data_policy: {
    training: true,
    can_publish: true,
    requires_user_ids: true,
    retains_prompts: true,
    retains_prompts_days: 30,
  },
  pricing: {
    text_input: 0.000001,
    text_output: 0.000002,
    internal_reasoning: 0.0000015,
    audio_input: 0.0000005,
    audio_cache_input: 0.00000025,
    cache_read: 0.0000001,
    cache_write: 0.0000005,
    image_input: 0.00001,
    image_output: 0.00002,
    request: 0.0001,
    web_search: 0.001,
    discount: 0.2,
  },
  limits: {
    text_input_tokens: 200000,
    text_output_tokens: 16000,
    image_input_tokens: 50000,
    images_per_input: 20,
    requests_per_minute: 100,
    requests_per_day: 10000,
  },
  context_length: 200000,
  quantization: 'fp16',
  supported_parameters: ['tools', 'response_format', 'structured_outputs'],
  completions: true,
  chat_completions: true,
  stream_cancellation: true,
  implicit_caching: true,
  file_urls: true,
  native_web_search: true,
  multipart: true,
  mandatory_reasoning: true,
  moderated: true,
  deranked: true,
  disabled: false,
  status: 200,
  updated_at: Date.now(),
}
