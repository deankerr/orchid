'use client'

import { getHourAlignedTimestamp } from '@/convex/shared'
import { useSnapshotStatus } from '@/hooks/api'
import { cn, formatSnapshotAtTime } from '@/lib/utils'

const STALENESS_LEVELS = [
  { hours: 24, color: 'text-red-400' }, // 24+ hours
  { hours: 4, color: 'text-amber-400' }, // 4+ hours
  { hours: 1, color: 'text-muted-foreground' }, // 1+ hours
] as const

function getStalenessColor(diff: number): string {
  const diffHours = diff / (60 * 60 * 1000)
  return STALENESS_LEVELS.find((level) => diffHours > level.hours)?.color ?? ''
}

export function SnapshotStatus() {
  const status = useSnapshotStatus()

  if (!status) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-pulse" />
        <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
      </div>
    )
  }

  if (!status.snapshot_at) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    )
  }

  const statusStyles = {
    ok: 'bg-green-500',
    in_progress: 'bg-green-500 animate-pulse',
    error: 'bg-red-500',
    unknown: 'bg-muted-foreground/50',
  } as const

  const current = getHourAlignedTimestamp()
  const diff = current - status.snapshot_at
  const stalenessColor = getStalenessColor(diff)
  const formattedTime = formatSnapshotAtTime(status.snapshot_at)

  return (
    <div
      className="flex items-center gap-2"
      title={`Snapshot status: ${status.status.replace('_', ' ')} • ${new Date(status.snapshot_at).toString()}`}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          statusStyles[status.status as keyof typeof statusStyles]
        )}
      />
      <span className={cn('text-xs font-mono', stalenessColor || 'text-foreground')}>
        {formattedTime}
      </span>
    </div>
  )
}