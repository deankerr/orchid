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

export function SnapshotAtBadge({ snapshot_at }: { snapshot_at: number }) {
  const current = getHourAlignedTimestamp()
  const diff = current - snapshot_at
  const color = getStalenessColor(diff)

  return (
    <Badge
      variant="outline"
      title={new Date(snapshot_at).toString()}
      className={cn('absolute top-3 right-3', color)}
    >
      {formatSnapshotAtTime(snapshot_at)}
    </Badge>
  )
}
