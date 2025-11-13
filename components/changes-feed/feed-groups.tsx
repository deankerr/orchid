import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatRelativeTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'

// * Timeline marker for crawl_id groups
export function FeedTimelineMarker({
  crawl_id,
  className,
}: {
  crawl_id: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge className="font-mono">{formatRelativeTime(Number(crawl_id))}</Badge>
      <Badge variant="secondary" className="font-mono">
        {formatDateTime(Number(crawl_id))}
      </Badge>
      <div className="h-px flex-1 border-b border-dashed" />
    </div>
  )
}
