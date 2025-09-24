import {
  AlarmClockIcon,
  BracesIcon,
  BrainCogIcon,
  CakeSliceIcon,
  CalendarIcon,
  ChevronsDownIcon,
  DatabaseIcon,
  FingerprintIcon,
  GlobeIcon,
  ImageIcon,
  LetterTextIcon,
  LinkIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  OctagonXIcon,
  SaveIcon,
  ScanEyeIcon,
  ScrollTextIcon,
  ShieldAlertIcon,
  SquareStopIcon,
  WrenchIcon,
} from 'lucide-react'

import { Doc } from '@/convex/_generated/dataModel'

type EndpointPartial = Partial<Doc<'or_views_endpoints'>>

export const attributes = {
  // Features (model)
  reasoning: {
    icon: BrainCogIcon,
    details: 'Model supports reasoning capabilities',
    color: 'indigo',
    has: (endpoint: EndpointPartial) => endpoint.model?.reasoning ?? false,
  },

  mandatory_reasoning: {
    icon: BrainCogIcon,
    details: 'Model always uses reasoning',
    color: 'indigo',
    variant: 'soft',
    has: (endpoint: EndpointPartial) => endpoint.model?.mandatory_reasoning ?? false,
  },

  // Features (endpoint)
  tools: {
    icon: WrenchIcon,
    details: 'Supports tool parameters',
    color: 'blue',
    has: (endpoint: EndpointPartial) => endpoint.supported_parameters?.includes('tools') ?? false,
  },

  response_format: {
    icon: BracesIcon,
    details: 'Supports the response_format parameter with json_object type',
    color: 'teal',
    has: (endpoint: EndpointPartial) =>
      endpoint.supported_parameters?.includes('response_format') ?? false,
  },

  structured_outputs: {
    icon: BracesIcon,
    details: 'Supports the response_format parameter with json_schema type',
    color: 'teal',
    variant: 'soft',
    has: (endpoint: EndpointPartial) =>
      endpoint.supported_parameters?.includes('structured_outputs') ?? false,
  },

  caching: {
    icon: DatabaseIcon,
    details: 'Inputs can be cached',
    color: 'cyan',
    has: (endpoint: EndpointPartial) => !!endpoint.pricing?.cache_read,
  },

  implicit_caching: {
    icon: DatabaseIcon,
    details: 'Inputs are cached automatically',
    color: 'cyan',
    variant: 'soft',
    has: (endpoint: EndpointPartial) => endpoint.implicit_caching ?? false,
  },

  // Features (OpenRouter)
  moderated: {
    icon: ShieldAlertIcon,
    details: 'Content is moderated by OpenRouter before being sent to the provider.',
    color: 'amber',
    has: (endpoint: EndpointPartial) => endpoint.moderated ?? false,
  },

  // Other features
  file_urls: {
    icon: LinkIcon,
    details: 'Supports file URL inputs',
    color: 'purple',
    has: (endpoint: EndpointPartial) => endpoint.file_urls ?? false,
  },

  native_web_search: {
    icon: GlobeIcon,
    details: 'Use native web search capabilities',
    color: 'emerald',
    has: (endpoint: EndpointPartial) => endpoint.native_web_search ?? false,
  },

  completions: {
    icon: MessageSquareIcon,
    details: 'Supports text completion API',
    color: 'blue',
    has: (endpoint: EndpointPartial) => endpoint.completions ?? false,
  },

  chat_completions: {
    icon: MessagesSquareIcon,
    details: 'Supports chat completion API',
    color: 'blue',
    has: (endpoint: EndpointPartial) => endpoint.chat_completions ?? false,
  },

  stream_cancellation: {
    icon: SquareStopIcon,
    details: 'Supports streaming cancellation',
    color: 'gray',
    has: (endpoint: EndpointPartial) => endpoint.stream_cancellation ?? false,
  },

  // Variant
  free: {
    icon: CakeSliceIcon,
    details: 'Free variant, subject to request limits and may have low availability.',
    color: 'pink',
    has: (endpoint: EndpointPartial) => endpoint.model?.variant === 'free',
  },

  // Status Flags
  deranked: {
    icon: ChevronsDownIcon,
    details: 'Will only be routed to as a fallback',
    color: 'amber',
    has: (endpoint: EndpointPartial) => endpoint.deranked ?? false,
  },

  disabled: {
    icon: OctagonXIcon,
    details: 'Endpoint is currently disabled',
    color: 'red',
    has: (endpoint: EndpointPartial) => endpoint.disabled ?? false,
  },

  // Data Policy
  training: {
    icon: ScanEyeIcon,
    details: 'Your data may be used to train new models.',
    color: 'orange',
    has: (endpoint: EndpointPartial) => endpoint.data_policy?.training === true,
  },

  data_publishing: {
    icon: ScrollTextIcon,
    details: 'Your data may be published or shared publicly.',
    color: 'orange',
    has: (endpoint: EndpointPartial) => endpoint.data_policy?.can_publish === true,
  },

  user_id: {
    icon: FingerprintIcon,
    details: 'An anonymous user ID is shared with the provider.',
    color: 'orange',
    has: (endpoint: EndpointPartial) => endpoint.data_policy?.requires_user_ids === true,
  },

  data_retention: {
    icon: SaveIcon,
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
    icon: LetterTextIcon,
    details: 'Maximum text input tokens allowed',
    color: 'yellow',
    has: (endpoint: EndpointPartial) => endpoint.limits?.text_input_tokens != null,
    getValue: (endpoint: EndpointPartial) => endpoint.limits?.text_input_tokens?.toLocaleString(),
  },

  max_image_input_tokens: {
    icon: ImageIcon,
    details: 'Maximum image input tokens allowed',
    color: 'yellow',
    has: (endpoint: EndpointPartial) => endpoint.limits?.image_input_tokens != null,
    getValue: (endpoint: EndpointPartial) => endpoint.limits?.image_input_tokens?.toLocaleString(),
  },

  max_images_per_input: {
    icon: ImageIcon,
    details: 'Maximum number of images per input',
    color: 'yellow',
    has: (endpoint: EndpointPartial) => endpoint.limits?.images_per_input != null,
    getValue: (endpoint: EndpointPartial) => endpoint.limits?.images_per_input?.toLocaleString(),
  },

  max_requests_per_minute: {
    icon: AlarmClockIcon,
    details: 'Maximum requests per minute allowed',
    color: 'yellow',
    has: (endpoint: EndpointPartial) => endpoint.limits?.requests_per_minute != null,
    getValue: (endpoint: EndpointPartial) => endpoint.limits?.requests_per_minute?.toLocaleString(),
  },

  max_requests_per_day: {
    icon: CalendarIcon,
    details: 'Maximum requests per day allowed',
    color: 'yellow',
    has: (endpoint: EndpointPartial) => endpoint.limits?.requests_per_day != null,
    getValue: (endpoint: EndpointPartial) => endpoint.limits?.requests_per_day?.toLocaleString(),
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
