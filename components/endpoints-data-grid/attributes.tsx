import {
  BracesIcon,
  BracketsIcon,
  BrainIcon,
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

import type { Doc } from '@/convex/_generated/dataModel'

import { Badge } from '@/components/ui/badge'

export const dataGridAttributes = {
  // Model Capabilities
  reasoning: {
    icon: <BrainIcon />,
    label: 'REASON',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => endpoint.model?.reasoning ?? false,
  },
  mandatory_reasoning: {
    icon: <BrainIcon />,
    label: 'REASON!',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) =>
      endpoint.model?.mandatory_reasoning ?? false,
  },

  // Advanced Features
  tools: {
    icon: <WrenchIcon />,
    label: 'TOOLS',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) =>
      endpoint.supported_parameters?.includes('tools') ?? false,
  },
  json: {
    icon: <BracketsIcon />,
    label: 'JSON',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) =>
      endpoint.supported_parameters?.includes('response_format') ?? false,
  },
  structured: {
    icon: <BracesIcon />,
    label: 'STRUCT',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) =>
      endpoint.supported_parameters?.includes('structured_outputs') ?? false,
  },

  // Pricing Features
  cache_pricing: {
    icon: <DatabaseIcon />,
    label: 'CACHE',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => !!endpoint.pricing?.cache_read,
  },

  // Endpoint Capabilities
  completions: {
    icon: <MessageSquareIcon />,
    label: 'COMPLETE',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => endpoint.completions ?? false,
  },
  chat_completions: {
    icon: <MessagesSquareIcon />,
    label: 'CHAT',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => endpoint.chat_completions ?? false,
  },
  stream_cancellation: {
    icon: <SquareStopIcon />,
    label: 'ABORT',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => endpoint.stream_cancellation ?? false,
  },
  implicit_caching: {
    icon: <DatabaseIcon />,
    label: 'CACHE',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => endpoint.implicit_caching ?? false,
  },
  file_urls: {
    icon: <LinkIcon />,
    label: 'FILE_URL',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => endpoint.file_urls ?? false,
  },
  native_web_search: {
    icon: <GlobeIcon />,
    label: 'SEARCH',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => endpoint.native_web_search ?? false,
  },

  // Variant/Pricing
  free: {
    icon: <CakeSliceIcon />,
    label: 'FREE',
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => endpoint.model?.variant === 'free',
  },

  // Status Flags
  moderated: {
    icon: <ShieldAlertIcon />,
    label: 'MODS',
    variant: 'destructive' as const,
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => endpoint.moderated ?? false,
  },
  deranked: {
    icon: <ChevronsDownIcon />,
    label: 'DERANKED',
    variant: 'secondary' as const,
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => endpoint.deranked ?? false,
  },
  disabled: {
    icon: <OctagonXIcon />,
    label: 'DISABLED',
    variant: 'destructive' as const,
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => endpoint.disabled ?? false,
  },

  // Data Policy
  trains: {
    icon: <ScanEyeIcon />,
    label: 'TRAIN',
    variant: 'destructive' as const,
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) => endpoint.data_policy?.training === true,
  },
  publishes: {
    icon: <ScrollTextIcon />,
    label: 'PUBLISH',
    variant: 'destructive' as const,
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) =>
      endpoint.data_policy?.can_publish === true,
  },
  requires_ids: {
    icon: <FingerprintIcon />,
    label: 'USER_ID',
    variant: 'destructive' as const,
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) =>
      endpoint.data_policy?.requires_user_ids === true,
  },
  retains: {
    icon: <SaveIcon />,
    label: 'RETAIN',
    variant: 'destructive' as const,
    has: (endpoint: Partial<Doc<'or_views_endpoints'>>) =>
      endpoint.data_policy?.retains_prompts === true,
  },
} as const

export type DataGridAttributeKey = keyof typeof dataGridAttributes

export function DataGridAttributeBadge({
  icon,
  label,
  ...props
}: {
  icon: React.ReactNode
  label: string
} & React.ComponentProps<typeof Badge>) {
  return (
    <Badge className="cursor-default font-mono uppercase" {...props}>
      {icon}
      {label}
    </Badge>
  )
}

export function getEndpointAttributes(endpoint: Partial<Doc<'or_views_endpoints'>>): Array<{
  key: string
  icon: React.ReactNode
  label: string
  variant?: 'secondary' | 'destructive'
}> {
  return Object.entries(dataGridAttributes)
    .filter(([_key, config]) => {
      return config.has(endpoint)
    })
    .map(([key, config]) => ({
      key,
      icon: config.icon,
      label: config.label,
      variant: 'variant' in config ? config.variant : ('secondary' as const),
    }))
}
