// Tremor Tracker [v1.0.0]

import React from 'react'

import { HoverCard as HoverCardPrimitives } from 'radix-ui'

import { cn } from '@/lib/utils'

interface TrackerBlockProps {
  key?: string | number
  color?: string
  tooltip?: string
  hoverEffect?: boolean
  defaultBackgroundColor?: string
}

const Block = ({ color, tooltip, defaultBackgroundColor, hoverEffect }: TrackerBlockProps) => {
  const [open, setOpen] = React.useState(false)
  return (
    <HoverCardPrimitives.Root
      open={open}
      onOpenChange={setOpen}
      openDelay={0}
      closeDelay={0}
      tremor-id="tremor-raw"
    >
      <HoverCardPrimitives.Trigger onClick={() => setOpen(true)} asChild>
        <div className="size-full overflow-hidden px-[0.5px] transition first:pl-0 last:pr-0 sm:px-px">
          <div
            className={cn(
              'size-full rounded-[1px]',
              color || defaultBackgroundColor,
              hoverEffect ? 'hover:opacity-50' : '',
            )}
          />
        </div>
      </HoverCardPrimitives.Trigger>
      <HoverCardPrimitives.Portal>
        <HoverCardPrimitives.Content
          sideOffset={10}
          side="top"
          align="center"
          avoidCollisions
          className={cn(
            // base
            'w-auto rounded-md px-2 py-1 font-mono text-xs',
            // text color
            'text-white dark:text-gray-900',
            // background color
            'bg-gray-900 dark:bg-gray-50',
          )}
        >
          {tooltip}
        </HoverCardPrimitives.Content>
      </HoverCardPrimitives.Portal>
    </HoverCardPrimitives.Root>
  )
}

Block.displayName = 'Block'

interface TrackerProps extends React.HTMLAttributes<HTMLDivElement> {
  data: TrackerBlockProps[]
  defaultBackgroundColor?: string
  hoverEffect?: boolean
}

const Tracker = React.forwardRef<HTMLDivElement, TrackerProps>(
  (
    {
      data = [],
      defaultBackgroundColor = 'bg-gray-400 dark:bg-gray-400',
      className,
      hoverEffect,
      ...props
    },
    forwardedRef,
  ) => {
    return (
      <div
        ref={forwardedRef}
        className={cn('group flex h-8 w-full items-center', className)}
        {...props}
      >
        {data.map(({ key, ...props }, index) => (
          <Block
            key={key ?? index}
            defaultBackgroundColor={defaultBackgroundColor}
            hoverEffect={hoverEffect}
            {...props}
          />
        ))}
      </div>
    )
  },
)

Tracker.displayName = 'Tracker'

export { Tracker, type TrackerBlockProps }
