'use client'

import { useSnapshotStatus } from '@/hooks/api'
import { cn } from '@/lib/utils'

export function SnapshotStatusIndicator() {
  const status = useSnapshotStatus()

  const statusStyles = {
    ok: 'bg-success',
    issues: 'bg-warning',
    in_progress: 'bg-success animate-pulse',
    error: 'bg-destructive',
    unknown: 'bg-muted-foreground/50',
  } as const

  // Determine status dot style - show loading dot when data is loading
  const dotStyle = status
    ? statusStyles[status.status as keyof typeof statusStyles]
    : 'bg-muted-foreground/30 animate-pulse'

  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-2 w-2 rounded-full', dotStyle)} />
    </div>
  )
}
