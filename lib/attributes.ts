import { Doc } from '@/convex/_generated/dataModel'

import { formatPrice } from './formatters'

type EndpointPartial = Partial<Doc<'or_views_endpoints'>>

export const attributes = {
  // Features (model)
  reasoning: {
    icon: 'brain-cog',
    details: 'Model supports reasoning capabilities',
    color: 'indigo',
    has: (endpoint: EndpointPartial) => endpoint.model?.reasoning ?? false,
  },

  // Features (endpoint)
  tools: {
    icon: 'wrench',
    details: 'Supports tool parameters',
    color: 'blue',
    has: (endpoint: EndpointPartial) => endpoint.supported_parameters?.includes('tools') ?? false,
  },

  response_format: {
    icon: 'braces',
    details: 'Supports the response_format parameter with json_object type',
    color: 'teal',
    has: (endpoint: EndpointPartial) =>
      endpoint.supported_parameters?.includes('response_format') ?? false,
  },

  structured_outputs: {
    icon: 'braces',
    details: 'Supports the response_format parameter with json_schema type',
    color: 'teal',
    variant: 'soft',
    has: (endpoint: EndpointPartial) =>
      endpoint.supported_parameters?.includes('structured_outputs') ?? false,
  },

  caching: {
    icon: 'database',
    details: 'Inputs can be cached',
    color: 'cyan',
    has: (endpoint: EndpointPartial) => !!endpoint.pricing?.cache_read,
  },

  implicit_caching: {
    icon: 'database',
    details: 'Inputs are cached automatically',
    color: 'cyan',
    variant: 'soft',
    has: (endpoint: EndpointPartial) => endpoint.implicit_caching ?? false,
  },

  mandatory_reasoning: {
    icon: 'brain-cog',
    details: 'Reasoning cannot be disabled.',
    color: 'indigo',
    variant: 'soft',
    has: (endpoint: EndpointPartial) => endpoint.mandatory_reasoning ?? false,
  },

  // Features (OpenRouter)
  moderated: {
    icon: 'shield-alert',
    details: 'Content is moderated by OpenRouter before being sent to the provider.',
    color: 'amber',
    has: (endpoint: EndpointPartial) => endpoint.moderated ?? false,
  },

  // Other features
  file_urls: {
    icon: 'link',
    details: 'Supports file URL inputs',
    color: 'purple',
    has: (endpoint: EndpointPartial) => endpoint.file_urls ?? false,
  },

  native_web_search: {
    icon: 'globe',
    details: 'Use native web search capabilities',
    color: 'emerald',
    has: (endpoint: EndpointPartial) => endpoint.native_web_search ?? false,
    getValue: (endpoint: EndpointPartial) => {
      if (endpoint.pricing?.web_search) {
        return formatPrice({
          priceKey: 'web_search',
          priceValue: endpoint.pricing.web_search,
        })
      }
      return undefined
    },
  },

  completions: {
    icon: 'message-square',
    details: 'Supports text completion API',
    color: 'blue',
    has: (endpoint: EndpointPartial) => endpoint.completions ?? false,
  },

  chat_completions: {
    icon: 'messages-square',
    details: 'Supports chat completion API',
    color: 'blue',
    has: (endpoint: EndpointPartial) => endpoint.chat_completions ?? false,
  },

  stream_cancellation: {
    icon: 'square-stop',
    details: 'Supports streaming cancellation',
    color: 'gray',
    has: (endpoint: EndpointPartial) => endpoint.stream_cancellation ?? false,
  },

  // Variant
  free: {
    icon: 'cake-slice',
    details: 'Free variant, subject to request limits and may have low availability.',
    color: 'pink',
    has: (endpoint: EndpointPartial) => endpoint.model?.variant === 'free',
  },

  // Status Flags
  deranked: {
    icon: 'chevrons-down',
    details: 'Will only be routed to as a fallback',
    color: 'amber',
    has: (endpoint: EndpointPartial) => endpoint.deranked ?? false,
  },

  disabled: {
    icon: 'octagon-x',
    details: 'Endpoint is currently disabled',
    color: 'red',
    has: (endpoint: EndpointPartial) => endpoint.disabled ?? false,
  },

  gone: {
    icon: 'skull',
    details: 'This endpoint no longer exists.',
    color: 'rose',
    has: (endpoint: EndpointPartial) => !!endpoint.unavailable_at,
    getValue: (endpoint: EndpointPartial) =>
      `Last seen: ${endpoint.unavailable_at?.toLocaleString() ?? 'unknown'}`,
  },

  // Data Policy
  training: {
    icon: 'scan-eye',
    details: 'Your data may be used to train new models.',
    color: 'orange',
    has: (endpoint: EndpointPartial) => endpoint.data_policy?.training === true,
  },

  data_publishing: {
    icon: 'scroll-text',
    details: 'Your data may be published or shared publicly.',
    color: 'orange',
    has: (endpoint: EndpointPartial) => endpoint.data_policy?.can_publish === true,
  },

  user_id: {
    icon: 'fingerprint',
    details: 'An anonymous user ID is shared with the provider.',
    color: 'orange',
    has: (endpoint: EndpointPartial) => endpoint.data_policy?.requires_user_ids === true,
  },

  data_retention: {
    icon: 'save',
    details: 'Your data may be retained by the provider.',
    color: 'orange',
    has: (endpoint: EndpointPartial) => endpoint.data_policy?.retains_prompts === true,
    getValue: (endpoint: EndpointPartial) => {
      const days = endpoint.data_policy?.retains_prompts_days?.toLocaleString()
      return days ? `${days} days` : `unknown period`
    },
  },

  // Limits
  max_text_input_tokens: {
    icon: 'letter-text',
    details: 'Maximum text input tokens allowed',
    color: 'yellow',
    has: (endpoint: EndpointPartial) => endpoint.limits?.text_input_tokens != null,
    getValue: (endpoint: EndpointPartial) => endpoint.limits?.text_input_tokens?.toLocaleString(),
  },

  max_image_input_tokens: {
    icon: 'image',
    details: 'Maximum image input tokens allowed',
    color: 'yellow',
    has: (endpoint: EndpointPartial) => endpoint.limits?.image_input_tokens != null,
    getValue: (endpoint: EndpointPartial) => endpoint.limits?.image_input_tokens?.toLocaleString(),
  },

  max_images_per_input: {
    icon: 'image',
    details: 'Maximum number of images per input',
    color: 'yellow',
    has: (endpoint: EndpointPartial) => endpoint.limits?.images_per_input != null,
    getValue: (endpoint: EndpointPartial) => endpoint.limits?.images_per_input?.toLocaleString(),
  },

  max_requests_per_minute: {
    icon: 'alarm-clock',
    details: 'Maximum requests per minute allowed',
    color: 'yellow',
    has: (endpoint: EndpointPartial) => endpoint.limits?.requests_per_minute != null,
    getValue: (endpoint: EndpointPartial) => endpoint.limits?.requests_per_minute?.toLocaleString(),
  },

  max_requests_per_day: {
    icon: 'calendar',
    details: 'Maximum requests per day allowed',
    color: 'yellow',
    has: (endpoint: EndpointPartial) => endpoint.limits?.requests_per_day != null,
    getValue: (endpoint: EndpointPartial) => endpoint.limits?.requests_per_day?.toLocaleString(),
  },

  // Modalities
  image_input: {
    icon: 'image-up',
    details: 'Supports image input',
    color: 'violet',
    has: (endpoint: EndpointPartial) =>
      endpoint.model?.input_modalities?.includes('image') ?? false,
  },

  image_output: {
    icon: 'image-down',
    details: 'Supports image output',
    color: 'violet',
    has: (endpoint: EndpointPartial) =>
      endpoint.model?.output_modalities?.includes('image') ?? false,
  },

  file_input: {
    icon: 'file-spreadsheet',
    details: 'Supports file input',
    color: 'sky',
    has: (endpoint: EndpointPartial) => endpoint.model?.input_modalities?.includes('file') ?? false,
  },

  audio_input: {
    icon: 'audio-lines',
    details: 'Supports audio input',
    color: 'fuchsia',
    has: (endpoint: EndpointPartial) =>
      endpoint.model?.input_modalities?.includes('audio') ?? false,
  },
} as const

export type AttributeName = keyof typeof attributes

export function getEndpointAttributeData(endpoint: EndpointPartial, name: AttributeName) {
  const attr = attributes[name]
  const value = 'getValue' in attr ? attr.getValue(endpoint) : undefined
  const variant = 'variant' in attr ? attr.variant : ('surface' as const)

  return {
    ...attr,
    has: attr.has(endpoint),
    name,
    value,
    variant,
  }
}
