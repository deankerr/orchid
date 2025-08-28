import * as R from 'remeda'

import {
  AudioLinesIcon,
  BracesIcon,
  BracketsIcon,
  BrainIcon,
  CakeSliceIcon,
  CameraIcon,
  DatabaseIcon,
  FileUpIcon,
  ImageUpIcon,
  OctagonXIcon,
  ScrollTextIcon,
  ShieldAlertIcon,
  TextIcon,
  WrenchIcon,
} from 'lucide-react'

import type { Endpoint, Model } from '@/hooks/api'
import { cn } from '@/lib/utils'

import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

export const attributes = {
  // Input Modalities
  text: {
    type: 'capability',
    icon: <TextIcon />,
    label: 'Text',
    description: 'Supports text inputs.',
    has: (args: { model: Model }) => args.model.input_modalities.includes('text'),
  },
  image: {
    type: 'capability',
    icon: <ImageUpIcon />,
    label: 'Image',
    description: 'Supports image inputs along with text prompts.',
    has: (args: { model: Model }) => args.model.input_modalities.includes('image'),
  },
  pdf: {
    type: 'capability',
    icon: <FileUpIcon />,
    label: 'PDF',
    description: 'Can process PDF inputs.',
    has: (args: { model: Model }) => args.model.input_modalities.includes('file'),
  },
  audio: {
    type: 'capability',
    icon: <AudioLinesIcon />,
    label: 'Audio',
    description: 'Can process audio inputs.',
    has: (args: { model: Model }) => args.model.input_modalities.includes('audio'),
  },

  // Endpoint Capabilities
  reason: {
    type: 'capability',
    icon: <BrainIcon />,
    label: 'Reason',
    description: 'Can use reasoning tokens to think about the prompt before their response.',
    has: (args: { endpoints: Endpoint[] }) =>
      args.endpoints.some((endpoint) => endpoint.capabilities.reasoning),
  },
  tools: {
    type: 'capability',
    icon: <WrenchIcon />,
    label: 'Tools',
    description: 'Supports function calling and tool usage.',
    has: (args: { endpoints: Endpoint[] }) =>
      args.endpoints.some((endpoint) => endpoint.capabilities.tools),
  },
  json: {
    type: 'capability',
    icon: <BracketsIcon />,
    label: 'JSON',
    description: 'Require JSON object response format.',
    has: (args: { endpoints: Endpoint[] }) =>
      args.endpoints.some((endpoint) => endpoint.supported_parameters.includes('response_format')),
  },
  struct: {
    type: 'capability',
    icon: <BracesIcon />,
    label: 'Struct',
    description: 'Strict JSON schema adherence for structured outputs.',
    has: (args: { endpoints: Endpoint[] }) =>
      args.endpoints.some((endpoint) =>
        endpoint.supported_parameters.includes('structured_outputs'),
      ),
  },
  cache: {
    type: 'capability',
    icon: <DatabaseIcon />,
    label: 'Cache',
    description: 'Supports prompt caching for improved performance and cost.',
    has: (args: { endpoints: Endpoint[] }) =>
      args.endpoints.some(
        (endpoint) => !!endpoint.pricing.cache_read && !!endpoint.pricing.cache_write,
      ),
  },

  // Per Endpoint
  // Variant/Pricing
  free: {
    type: 'variant',
    icon: <CakeSliceIcon />,
    label: 'Free',
    description: 'Available as a free tier option.',
    has: (args: { endpoints: Endpoint[] }) =>
      args.endpoints.some((endpoint) => endpoint.model_variant === 'free'),
  },

  // Moderation & Policies
  isModerated: {
    type: 'data-policy',
    icon: <ShieldAlertIcon />,
    label: 'Moderated',
    description: 'Content is automatically moderated by the provider.',
    variant: 'destructive',
    has: (args: { endpoints: Endpoint[] }) =>
      args.endpoints.some((endpoint) => endpoint.is_moderated),
  },
  trainsOnData: {
    type: 'data-policy',
    icon: <CameraIcon />,
    label: 'Trains',
    description: 'Provider may use your prompts to train their models.',
    variant: 'destructive',
    has: (args: { endpoints: Endpoint[] }) =>
      args.endpoints.some((endpoint) => endpoint.data_policy.training),
  },
  canPublish: {
    type: 'data-policy',
    icon: <ScrollTextIcon />,
    label: 'Publish',
    description: 'Provider may publish or share your prompts publicly.',
    variant: 'destructive',
    has: (args: { endpoints: Endpoint[] }) =>
      args.endpoints.some((endpoint) => endpoint.data_policy.can_publish),
  },

  // Status
  isDisabled: {
    type: 'status',
    icon: <OctagonXIcon />,
    label: 'Disabled',
    description: 'This endpoint is currently disabled.',
    variant: 'destructive',
    has: (args: { endpoints: Endpoint[] }) =>
      args.endpoints.some((endpoint) => endpoint.is_disabled),
  },
} as const

export const attributesMap = new Map(Object.entries(attributes) as [AttributeKey, AttributeDef][])

export type AttributeKey = keyof typeof attributes
export type AttributeDef = (typeof attributes)[AttributeKey]

export type AttributeCapabilityKey = {
  [K in keyof typeof attributes]: (typeof attributes)[K]['type'] extends 'capability' ? K : never
}[keyof typeof attributes]

export function getModelCapabilityAttributes(args: { model: Model; endpoints: Endpoint[] }) {
  return R.entries(attributes).filter(([_, attr]) => attr.type === 'capability' && attr.has(args))
}

export function AttributeBadge({
  attribute,
  className,
  ...props
}: {
  attribute: AttributeKey
} & React.ComponentProps<typeof Badge>) {
  const config = attributes[attribute]
  const variant = 'variant' in config ? config.variant : 'secondary'
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={variant}
            className={cn(className, 'cursor-default font-mono uppercase')}
            {...props}
          >
            {config.icon} {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
