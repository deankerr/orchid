'use client'

import { formatDistanceToNow } from 'date-fns'
import { Archive, CheckCircle, Clock, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, formatSnapshotAtTime } from '@/lib/utils'

interface SnapshotRun {
  _id: string
  snapshot_at: number
  started_at: number
  ended_at?: number
  ok: boolean
  pipelines: Array<{
    name: string
    ok: boolean
    error?: string
    metrics?: any
  }>
}

interface SnapshotRunsListProps {
  runs: SnapshotRun[]
  selectedRunId: string | null
  onSelectRun: (runId: string | null) => void
}

function getStatusIcon(run: SnapshotRun) {
  if (!run.ended_at) {
    return <Clock className="h-4 w-4 text-blue-500" />
  }
  return run.ok ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  )
}

function getStatusBadge(run: SnapshotRun) {
  if (!run.ended_at) {
    return <Badge variant="secondary">Running</Badge>
  }
  return run.ok ? (
    <Badge variant="default" className="bg-green-600">
      Success
    </Badge>
  ) : (
    <Badge variant="destructive">Failed</Badge>
  )
}

function formatDuration(startedAt: number, endedAt?: number) {
  if (!endedAt) {
    return `${Math.round((Date.now() - startedAt) / 1000)}s (running)`
  }
  return `${Math.round((endedAt - startedAt) / 1000)}s`
}

function hasArchives(run: SnapshotRun): boolean {
  return run.ok && !!run.ended_at
}

export function SnapshotRunsList({ runs, selectedRunId, onSelectRun }: SnapshotRunsListProps) {
  return (
    <ScrollArea
      className="-my-4 h-64 *:data-[slot=scroll-area-viewport]:overscroll-none"
      type="always"
    >
      <div className="space-y-1 px-4">
        {runs.map((run) => (
          <Button
            key={run._id}
            variant="ghost"
            className={cn(
              'h-auto w-full justify-start p-2 text-left',
              selectedRunId === run._id && 'bg-muted',
            )}
            onClick={() => onSelectRun(run._id)}
          >
            <div className="flex w-full items-center gap-3">
              <div className="flex-shrink-0">{getStatusIcon(run)}</div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-1 font-mono text-xs">
                    {formatSnapshotAtTime(run.snapshot_at)}
                  </code>
                  {getStatusBadge(run)}
                  {hasArchives(run) && (
                    <Badge variant="outline" className="text-xs">
                      <Archive className="mr-1 h-3 w-3" />
                      Archives
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}</span>
                <span>{formatDuration(run.started_at, run.ended_at)}</span>
                <span>{run.pipelines.length} pipelines</span>
                {run.pipelines.some((p) => !p.ok) && (
                  <span className="text-red-600">
                    {run.pipelines.filter((p) => !p.ok).length} failed
                  </span>
                )}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}
