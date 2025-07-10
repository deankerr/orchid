import { getHourAlignedTimestamp } from '@/convex/shared'

import { Badge } from '@/components/ui/badge'
import { cn, formatSnapshotAtTime } from '@/lib/utils'

const STALENESS_LEVELS = [
  { hours: 24, color: 'text-red-400' }, // 24+ hours
  { hours: 4, color: 'text-amber-400' }, // 4+ hours
  { hours: 1, color: 'text-muted-foreground' }, // 4+ hours
] as const

function getStalenessColor(diff: number): string {
  const diffHours = diff / (60 * 60 * 1000)
  return STALENESS_LEVELS.find((level) => diffHours > level.hours)?.color ?? ''
}

export function SnapshotAtBadge({
  snapshot_at,
  className,
  loading = false,
}: {
  snapshot_at?: number | null
  className?: string
  loading?: boolean
}) {
  // Loading state - show pulsing badge with consistent width
  if (loading || snapshot_at === undefined) {
    return (
      <Badge
        variant="outline"
        title="Loading snapshot data..."
        className={cn('animate-pulse', className)}
      >
        {'  LOADING  '}
      </Badge>
    )
  }

  // No data state
  if (snapshot_at === null) {
    return (
      <Badge
        variant="outline"
        title="No snapshot data available"
        className={cn('text-muted-foreground', className)}
      >
        {'  NO DATA  '}
      </Badge>
    )
  }

  // Normal state with timestamp
  const current = getHourAlignedTimestamp()
  const diff = current - snapshot_at
  const color = getStalenessColor(diff)

  return (
    <Badge
      variant="outline"
      title={new Date(snapshot_at).toString()}
      className={cn('', color, className)}
    >
      {formatSnapshotAtTime(snapshot_at)}
    </Badge>
  )
}
