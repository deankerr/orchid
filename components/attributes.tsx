import {
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
  WrenchIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

export const attributes = {
  // Input Modalities
  imageInput: {
    icon: <ImageUpIcon />,
    label: 'Image',
    description: 'Supports image inputs along with text prompts.',
  },
  fileInput: {
    icon: <FileUpIcon />,
    label: 'PDF',
    description: 'Can process PDF inputs.',
  },

  // Model Capabilities
  reasoning: {
    icon: <BrainIcon />,
    label: 'Reason',
    description: 'Can use reasoning tokens to think about the prompt before their response.',
  },
  tools: {
    icon: <WrenchIcon />,
    label: 'Tools',
    description: 'Supports function calling and tool usage.',
  },
  jsonObject: {
    icon: <BracketsIcon />,
    label: 'JSON',
    description: 'Require JSON object response format.',
  },
  structuredOutputs: {
    icon: <BracesIcon />,
    label: 'Struct',
    description: 'Strict JSON schema adherence for structured outputs.',
  },
  promptCaching: {
    icon: <DatabaseIcon />,
    label: 'Cache',
    description: 'Supports prompt caching for improved performance and cost.',
  },

  // Variant/Pricing
  freeVariant: {
    icon: <CakeSliceIcon />,
    label: 'Free',
    description: 'Available as a free tier option.',
  },

  // Moderation & Policies
  isModerated: {
    icon: <ShieldAlertIcon />,
    label: 'Moderated',
    description: 'Content is automatically moderated by the provider.',
    variant: 'alert',
  },
  trainsOnData: {
    icon: <CameraIcon />,
    label: 'Trains',
    description: 'Provider may use your prompts to train their models.',
    variant: 'alert',
  },
  canPublish: {
    icon: <ScrollTextIcon />,
    label: 'Publish',
    description: 'Provider may publish or share your prompts publicly.',
    variant: 'alert',
  },

  // Status
  isDisabled: {
    icon: <OctagonXIcon />,
    label: 'Disabled',
    description: 'This endpoint is currently disabled.',
    variant: 'destructive',
  },
} as const

export type AttributeKey = keyof typeof attributes

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
