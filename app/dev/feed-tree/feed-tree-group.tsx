'use client'

import * as React from 'react'

import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export function FeedTreeGroup({
  children,
  defaultValue,
  ...props
}: {
  defaultValue?: string
} & Omit<
  React.ComponentProps<typeof AccordionPrimitive.Root>,
  'type' | 'collapsible' | 'value' | 'defaultValue' | 'onValueChange'
>) {
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      defaultValue={defaultValue}
      data-slot="feed-tree-group"
      {...props}
    >
      {children}
    </AccordionPrimitive.Root>
  )
}

export function FeedTreeItem({
  value,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item value={value} data-slot="feed-tree-item" {...props}>
      {children}
    </AccordionPrimitive.Item>
  )
}

export function FeedTreeTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          'flex flex-1 items-center gap-1.5 py-0 text-left transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-90',
          className,
        )}
        data-slot="feed-tree-trigger"
        {...props}
      >
        <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200" />
        {children}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

export function FeedTreeContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        'ml-2 space-y-6 overflow-hidden border-l pt-6 pl-6 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        className,
      )}
      data-slot="feed-tree-content"
      {...props}
    >
      {children}
    </AccordionPrimitive.Content>
  )
}
