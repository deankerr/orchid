'use client'

import { parseAsString, useQueryState } from 'nuqs'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSnapshotRuns } from '@/hooks/api'

import { ErrorState } from '../loading'
import { PageContainer, PageHeader, PageLoading, PageTitle } from '../page-container'
import { SnapshotRunDetail } from './snapshot-run-detail'
import { SnapshotRunsList } from './snapshot-runs-list'

export function SnapshotDashboard() {
  const runs = useSnapshotRuns(100)
  const [selectedRunId, setSelectedRunId] = useQueryState('run', parseAsString)
  const selectedRun = runs?.find((r) => r._id === selectedRunId)

  if (!runs) {
    if (runs === null) {
      return (
        <PageContainer>
          <ErrorState message="Failed to load providers" />
        </PageContainer>
      )
    }
    return <PageLoading />
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Snapshots</PageTitle>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {runs.length} runs
          </Badge>
          <Badge variant="outline" className="font-mono">
            {runs.filter((run) => run.ok && run.ended_at).length} with archives
          </Badge>
        </div>
      </PageHeader>

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
      {selectedRun && <SnapshotRunDetail run={selectedRun} />}
    </PageContainer>
  )
}
