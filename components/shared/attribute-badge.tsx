import {
  BracesIcon,
  BrainCogIcon,
  CakeSliceIcon,
  ChevronsDownIcon,
  DatabaseIcon,
  FingerprintIcon,
  GlobeIcon,
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

import { cn } from '@/lib/utils'

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { RadBadge } from './rad-badge'

type EndpointPartial = Partial<Doc<'or_views_endpoints'>>

const attributeData = {
  // Model Capabilities
  reasoning: {
    icon: <BrainCogIcon />,
    label: 'Reason',
    tooltip: 'Model supports reasoning capabilities',
    color: 'indigo',
    variant: 'surface',
    has: (endpoint: EndpointPartial) => endpoint.model?.reasoning ?? false,
  },
  mandatory_reasoning: {
    icon: <BrainCogIcon />,
    label: 'Reason!',
    tooltip: 'Model always uses reasoning',
    color: 'indigo',
    variant: 'soft',
    has: (endpoint: EndpointPartial) => endpoint.model?.mandatory_reasoning ?? false,
  },

  // Advanced Features
  tools: {
    icon: <WrenchIcon />,
    label: 'Tools',
    tooltip: 'Supports tool use/function calling',
    color: 'blue',
    variant: 'surface',
    has: (endpoint: EndpointPartial) => endpoint.supported_parameters?.includes('tools') ?? false,
  },
  json_format: {
    icon: <BracesIcon />,
    label: 'JSON',
    tooltip: 'Supports JSON response format',
    color: 'teal',
    variant: 'surface',
    has: (endpoint: EndpointPartial) =>
      endpoint.supported_parameters?.includes('response_format') ?? false,
  },
  json_struct: {
    icon: <BracesIcon />,
    label: 'Struct',
    tooltip: 'Supports structured outputs',
    color: 'teal',
    variant: 'soft',
    has: (endpoint: EndpointPartial) =>
      endpoint.supported_parameters?.includes('structured_outputs') ?? false,
  },

  // Endpoint Capabilities
  caching: {
    icon: <DatabaseIcon />,
    label: 'Cache',
    tooltip: 'Inputs can be cached',
    color: 'cyan',
    variant: 'surface',
    has: (endpoint: EndpointPartial) => !!endpoint.pricing?.cache_read,
  },
  implicit_caching: {
    icon: <DatabaseIcon />,
    label: 'Cache',
    tooltip: 'Inputs are cached automatically',
    color: 'cyan',
    variant: 'soft',
    has: (endpoint: EndpointPartial) => endpoint.implicit_caching ?? false,
  },

  completions: {
    icon: <MessageSquareIcon />,
    label: 'Complete',
    tooltip: 'Supports text completion API',
    color: 'blue',
    variant: 'outline',
    has: (endpoint: EndpointPartial) => endpoint.completions ?? false,
  },
  chat_completions: {
    icon: <MessagesSquareIcon />,
    label: 'Chat',
    tooltip: 'Supports chat completion API',
    color: 'blue',
    variant: 'outline',
    has: (endpoint: EndpointPartial) => endpoint.chat_completions ?? false,
  },
  stream_cancellation: {
    icon: <SquareStopIcon />,
    label: 'Abort',
    tooltip: 'Supports streaming cancellation',
    color: 'gray',
    variant: 'soft',
    has: (endpoint: EndpointPartial) => endpoint.stream_cancellation ?? false,
  },

  file_urls: {
    icon: <LinkIcon />,
    label: 'File URL',
    tooltip: 'Supports file URL inputs',
    color: 'purple',
    variant: 'soft',
    has: (endpoint: EndpointPartial) => endpoint.file_urls ?? false,
  },
  native_web_search: {
    icon: <GlobeIcon />,
    label: 'Search',
    tooltip: 'Native web search capabilities',
    color: 'teal',
    variant: 'soft',
    has: (endpoint: EndpointPartial) => endpoint.native_web_search ?? false,
  },

  // Variant/Pricing
  free: {
    icon: <CakeSliceIcon />,
    label: 'Free',
    tooltip: 'Free model variant',
    color: 'emerald',
    variant: 'soft',
    has: (endpoint: EndpointPartial) => endpoint.model?.variant === 'free',
  },

  // Status Flags
  moderated: {
    icon: <ShieldAlertIcon />,
    label: 'Mods',
    tooltip: 'Content moderation enabled',
    color: 'amber',
    variant: 'surface',
    has: (endpoint: EndpointPartial) => endpoint.moderated ?? false,
  },
  deranked: {
    icon: <ChevronsDownIcon />,
    label: 'Deranked',
    tooltip: 'Will only be routed to as a fallback',
    color: 'amber',
    variant: 'surface',
    has: (endpoint: EndpointPartial) => endpoint.deranked ?? false,
  },
  disabled: {
    icon: <OctagonXIcon />,
    label: 'Disabled',
    tooltip: 'Endpoint is currently disabled',
    color: 'red',
    variant: 'solid',
    has: (endpoint: EndpointPartial) => endpoint.disabled ?? false,
  },

  // Data Policy
  trains: {
    icon: <ScanEyeIcon />,
    label: 'Train',
    tooltip: 'Data used for training purposes',
    color: 'orange',
    variant: 'surface',
    has: (endpoint: EndpointPartial) => endpoint.data_policy?.training === true,
  },
  publishes: {
    icon: <ScrollTextIcon />,
    label: 'Publish',
    tooltip: 'Data may be published or shared',
    color: 'orange',
    variant: 'surface',
    has: (endpoint: EndpointPartial) => endpoint.data_policy?.can_publish === true,
  },
  requires_ids: {
    icon: <FingerprintIcon />,
    label: 'User ID',
    tooltip: 'Requires user identification',
    color: 'orange',
    variant: 'surface',
    has: (endpoint: EndpointPartial) => endpoint.data_policy?.requires_user_ids === true,
  },
  retains: {
    icon: <SaveIcon />,
    label: 'Retain',
    tooltip: 'Prompts and data are retained',
    color: 'orange',
    variant: 'surface',
    has: (endpoint: EndpointPartial) => endpoint.data_policy?.retains_prompts === true,
  },
} as const

export type AttributeKey = keyof typeof attributeData

export function getEndpointAttributes(endpoint: EndpointPartial, filter?: AttributeKey[]) {
  return Object.entries(attributeData)
    .filter(([key]) => (filter ? filter.includes(key as AttributeKey) : true))
    .filter(([_key, config]) => config.has(endpoint))
    .map(([key]) => key as AttributeKey)
}

export function hasEndpointAttribute(endpoint: EndpointPartial, attribute: AttributeKey) {
  const data = attributeData[attribute]
  return data && data.has(endpoint)
}

export function AttributeBadge({ value }: { value: AttributeKey }) {
  const data = attributeData[value]

  if (!data) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <RadBadge
          className={cn('size-7 shrink-0 px-1 py-1 font-mono uppercase [&>svg]:size-full')}
          variant={data.variant}
          color={data.color}
        >
          {data.icon}
          <span className="sr-only">{data.label}</span>
        </RadBadge>
      </TooltipTrigger>

      <TooltipContent className="">{data.tooltip}</TooltipContent>
    </Tooltip>
  )
}
