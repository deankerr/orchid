import {
  AudioLinesIcon,
  BoxIcon,
  FileChartColumnIncreasingIcon,
  ImageIcon,
  LetterTextIcon,
} from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const modalityIcons = {
  text: <LetterTextIcon />,
  image: <ImageIcon />,
  file: <FileChartColumnIncreasingIcon />,
  audio: <AudioLinesIcon />,
}

export function ModalityIconBadge({
  modality,
  className,
  ...props
}: {
  modality: string
} & React.ComponentProps<'div'>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'grid size-6.5 cursor-default rounded-sm bg-secondary p-1 font-mono text-secondary-foreground uppercase [&_svg]:size-full',
            className,
          )}
          {...props}
        >
          {modalityIcons[modality as keyof typeof modalityIcons] ?? <BoxIcon />}
        </div>
      </TooltipTrigger>
      <TooltipContent className="font-mono uppercase">{modality}</TooltipContent>
    </Tooltip>
  )
}

export function ModalityIconBadges({
  modalities,
  className,
  ...props
}: { modalities: string[] } & React.ComponentProps<'div'>) {
  const knownKeys = Object.keys(modalityIcons)
  const modalitySet = new Set(modalities)

  // Known modalities in consistent order
  const knownModalities = knownKeys.filter((key) => modalitySet.has(key))

  // Unknown modalities (will render with box icon)
  const unknownModalities = modalities.filter((modality) => !knownKeys.includes(modality))

  return (
    <div className={cn('flex flex-wrap gap-1', className)} {...props}>
      {knownModalities.map((modality) => (
        <ModalityIconBadge key={modality} modality={modality} />
      ))}
      {unknownModalities.map((modality) => (
        <ModalityIconBadge key={modality} modality={modality} />
      ))}
    </div>
  )
}
