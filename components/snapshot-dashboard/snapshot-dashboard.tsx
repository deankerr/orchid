'use client'

import { parseAsString, useQueryState } from 'nuqs'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSnapshotRuns, useSnapshotStatus } from '@/hooks/api'

import { PageContainer, PageHeader, PageLoading, PageTitle } from '../shared/page-container'
import { SnapshotAtBadge } from '../shared/snapshot-at-badge'
import { SnapshotRunDetail } from './snapshot-run-detail'
import { SnapshotRunsList } from './snapshot-runs-list'

export function SnapshotDashboard() {
  const status = useSnapshotStatus()
  const runs = useSnapshotRuns(100)
  const [selectedRunId, setSelectedRunId] = useQueryState('run', parseAsString)
  const selectedRun = runs?.find((r) => r._id === selectedRunId)

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Snapshots</PageTitle>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {runs?.length ?? 0} runs
          </Badge>
          <Badge variant="outline" className="font-mono">
            {runs?.filter((run) => run.ok && run.ended_at).length ?? 0} with archives
          </Badge>
          <SnapshotAtBadge snapshot_at={status?.snapshot_at} loading={!status} />
        </div>
      </PageHeader>

      {/* Runs List */}
      {runs ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Snapshot Runs</CardTitle>
            <CardDescription>
              Select a run to view pipeline details and archived data
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <SnapshotRunsList
              runs={runs}
              selectedRunId={selectedRunId}
              onSelectRun={setSelectedRunId}
            />
          </CardContent>
        </Card>
      ) : (
        <PageLoading />
      )}

      {/* Selected Run Details */}
      {selectedRun && <SnapshotRunDetail run={selectedRun} />}
    </PageContainer>
  )
}
