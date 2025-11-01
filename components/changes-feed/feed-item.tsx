import type { Doc } from '@/convex/_generated/dataModel'

import { cn } from '@/lib/utils'

import { Badge } from '../ui/badge'

export type EndpointChangeDoc = Extract<Doc<'or_views_changes'>, { entity_type: 'endpoint' }>

// * Core FeedItem component - fully composable
export function FeedItem({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-sm border border-transparent p-1 transition-colors hover:border-border/50 hover:bg-muted/20',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// * Main content area
export function FeedItemContent({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-1 flex-col gap-1', className)} {...props}>
      {children}
    </div>
  )
}

// * Change sentence/description
export function FeedItemSentence({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5 text-sm text-foreground', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// * Change path display
export function FeedItemPath({ path }: { path: string }) {
  return (
    <Badge variant="outline" className="font-mono text-muted-foreground">
      {path}
    </Badge>
  )
}
