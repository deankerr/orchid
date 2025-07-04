'use client'

import { parseAsString, useQueryState } from 'nuqs'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSnapshotRuns } from '@/hooks/api'

import { SnapshotRunDetail } from './snapshot-run-detail'
import { SnapshotRunsList } from './snapshot-runs-list'

export function SnapshotDashboard() {
  const [selectedRunId, setSelectedRunId] = useQueryState('run', parseAsString)
  const runs = useSnapshotRuns(100)

  if (!runs) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-48 rounded bg-muted"></div>
          <div className="h-64 rounded bg-muted"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Snapshot Dashboard</h1>
          <p className="text-muted-foreground">
            View snapshot runs, pipeline details, and archived data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {runs.length} runs
          </Badge>
          <Badge variant="outline" className="font-mono">
            {runs.filter((run) => run.ok && run.ended_at).length} with archives
          </Badge>
        </div>
      </div>

      {/* Runs List */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Snapshot Runs</CardTitle>
          <CardDescription>Select a run to view pipeline details and archived data</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <SnapshotRunsList
            runs={runs}
            selectedRunId={selectedRunId}
            onSelectRun={setSelectedRunId}
          />
        </CardContent>
      </Card>

      {/* Selected Run Details */}
      {selectedRunId && <SnapshotRunDetail runId={selectedRunId} />}
    </div>
  )
}
