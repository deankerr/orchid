'use client'

import { useSnapshotStatus } from '@/hooks/api'
import { cn } from '@/lib/utils'

export function SnapshotStatus() {
  const status = useSnapshotStatus()

  if (!status) {
    return (
      <div className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-pulse" />
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
      className={cn(
        'w-2 h-2 rounded-full',
        statusStyles[status.status as keyof typeof statusStyles]
      )}
      title={`Snapshot status: ${status.status.replace('_', ' ')}`}
    />
  )
}