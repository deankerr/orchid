'use client'

import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

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
    <Badge variant="default" className="bg-green-600">Success</Badge>
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

export function SnapshotRunsList({ runs, selectedRunId, onSelectRun }: SnapshotRunsListProps) {
  return (
    <ScrollArea className="h-96">
      <div className="space-y-2 p-6">
        {runs.map((run) => (
          <Button
            key={run._id}
            variant="ghost"
            className={cn(
              'w-full justify-start p-3 h-auto text-left',
              selectedRunId === run._id && 'bg-muted'
            )}
            onClick={() => onSelectRun(run._id)}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(run)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs font-mono bg-muted px-1 rounded">
                    {formatSnapshotAtTime(run.snapshot_at)}
                  </code>
                  {getStatusBadge(run)}
                </div>
                
                <div className="text-xs text-muted-foreground flex items-center gap-4">
                  <span>
                    {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                  </span>
                  <span>
                    {formatDuration(run.started_at, run.ended_at)}
                  </span>
                  <span>
                    {run.pipelines.length} pipelines
                  </span>
                </div>
                
                {run.pipelines.some(p => !p.ok) && (
                  <div className="text-xs text-red-600 mt-1">
                    {run.pipelines.filter(p => !p.ok).length} pipeline(s) failed
                  </div>
                )}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}