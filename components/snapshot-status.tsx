'use client'

import { SnapshotAtBadge } from '@/components/snapshot-at-badge'
import { useSnapshotStatus } from '@/hooks/api'
import { cn } from '@/lib/utils'

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

  return (
    <div
      className="flex items-center gap-2"
      title={`Snapshot status: ${status.status.replace('_', ' ')}`}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          statusStyles[status.status as keyof typeof statusStyles]
        )}
      />
      <SnapshotAtBadge 
        snapshot_at={status.snapshot_at}
        className="static bg-transparent border-none p-0 h-auto text-xs font-mono"
      />
    </div>
  )
}