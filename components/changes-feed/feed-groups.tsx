import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatRelativeTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'

// * Timeline marker for crawl_id groups
export function FeedTimeline({
  crawl_id,
  count,
  className,
}: {
  crawl_id: string
  count?: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge className="font-mono">{formatRelativeTime(Number(crawl_id))}</Badge>
      <Badge variant="secondary" className="font-mono">
        {formatDateTime(Number(crawl_id))}
      </Badge>
      <div className="h-px flex-1 bg-border" />
      {count !== undefined && (
        <div className="font-mono text-xs text-muted-foreground">{count}</div>
      )}
    </div>
  )
}

// * Compact list container (for feed items)
export function FeedList({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('space-y-0.5', className)} {...props}>
      {children}
    </div>
  )
}
