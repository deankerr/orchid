'use client'

import { SnapshotAtBadge } from '@/components/snapshot-at-badge'
import { useSnapshotStatus } from '@/hooks/api'
import { cn } from '@/lib/utils'

export function SnapshotStatus() {
  const status = useSnapshotStatus()

  const statusStyles = {
    ok: 'bg-green-500',
    in_progress: 'bg-green-500 animate-pulse',
    error: 'bg-red-500',
    unknown: 'bg-muted-foreground/50',
  } as const

  // Determine status dot style - show loading dot when data is loading
  const dotStyle = status 
    ? statusStyles[status.status as keyof typeof statusStyles]
    : 'bg-muted-foreground/30 animate-pulse'

  return (
    <div
      className="flex items-center gap-2"
      title={status ? `Snapshot status: ${status.status.replace('_', ' ')}` : 'Loading...'}
    >
      <div
        className={cn('w-2 h-2 rounded-full', dotStyle)}
      />
      <SnapshotAtBadge 
        snapshot_at={status?.snapshot_at}
        loading={!status}
        className="static bg-transparent border-none p-0 h-auto text-xs font-mono"
      />
    </div>
  )
}