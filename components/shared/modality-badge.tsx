import {
  AudioLinesIcon,
  BoxIcon,
  FileChartColumnIncreasingIcon,
  ImageIcon,
  LetterTextIcon,
} from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { RadBadge } from './rad-badge'

const modalityData = {
  text: {
    icon: <LetterTextIcon />,
    label: 'Text',
    tooltip: 'Text',
    color: 'neutral',
    variant: 'soft',
  },
  image: {
    icon: <ImageIcon />,
    label: 'Image',
    tooltip: 'Image',
    color: 'neutral',
    variant: 'soft',
  },
  file: {
    icon: <FileChartColumnIncreasingIcon />,
    label: 'File',
    tooltip: 'File',
    color: 'neutral',
    variant: 'soft',
  },
  audio: {
    icon: <AudioLinesIcon />,
    label: 'Audio',
    tooltip: 'Audio',
    color: 'neutral',
    variant: 'soft',
  },
} as const

export type ModalityKey = keyof typeof modalityData

export function getModalityData(modality: string) {
  if (modality in modalityData) {
    return modalityData[modality as ModalityKey]
  }

  // Fallback for unknown modalities
  return {
    icon: <BoxIcon />,
    label: modality,
    tooltip: modality,
    color: 'neutral' as const,
    variant: 'soft' as const,
  }
}

export function getAllModalityData() {
  return Object.entries(modalityData).map(([key, data]) => ({
    key: key as ModalityKey,
    ...data,
  }))
}

export function getModalityKeys(): ModalityKey[] {
  return Object.keys(modalityData) as ModalityKey[]
}

export function ModalityBadge({
  modality,
  className,
  ...props
}: {
  modality: string
} & React.ComponentProps<typeof RadBadge>) {
  const data = getModalityData(modality)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <RadBadge
          className={cn(
            'size-7 shrink-0 px-1 py-1 font-mono uppercase [&>svg]:size-full',
            className,
          )}
          variant={data.variant}
          color={data.color}
          {...props}
        >
          {data.icon}
          <span className="sr-only">{data.label}</span>
        </RadBadge>
      </TooltipTrigger>
      <TooltipContent className="font-mono uppercase">{data.tooltip}</TooltipContent>
    </Tooltip>
  )
}

export function ModalityBadges({
  modalities,
  className,
  ...props
}: { modalities: string[] } & React.ComponentProps<'div'>) {
  const knownKeys = Object.keys(modalityData)
  const modalitySet = new Set(modalities)

  // Known modalities in consistent order
  const knownModalities = knownKeys.filter((key) => modalitySet.has(key))

  // Unknown modalities (will render with box icon)
  const unknownModalities = modalities.filter((modality) => !knownKeys.includes(modality))

  return (
    <div className={cn('flex gap-1', className)} {...props}>
      {knownModalities.map((modality) => (
        <ModalityBadge key={modality} modality={modality} />
      ))}
      {unknownModalities.map((modality) => (
        <ModalityBadge key={modality} modality={modality} />
      ))}
    </div>
  )
}
