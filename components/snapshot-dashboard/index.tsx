'use client'

import { useState } from 'react'
import { parseAsString, useQueryState } from 'nuqs'

import { useSnapshotRuns } from '@/hooks/api'
import { SnapshotRunsList } from './snapshot-runs-list'
import { SnapshotRunDetail } from './snapshot-run-detail'
import { ArchiveBrowser } from './archive-browser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function SnapshotDashboard() {
  const [selectedRunId, setSelectedRunId] = useQueryState('run', parseAsString)
  const [selectedArchive, setSelectedArchive] = useState<string | null>(null)
  const runs = useSnapshotRuns(100)

  if (!runs) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Snapshot Dashboard</h1>
          <p className="text-muted-foreground">
            View snapshot runs and archived data for debugging and analysis
          </p>
        </div>
        <Badge variant="outline" className="font-mono">
          {runs.length} runs
        </Badge>
      </div>

      <Tabs defaultValue="runs" className="w-full">
        <TabsList>
          <TabsTrigger value="runs">Snapshot Runs</TabsTrigger>
          <TabsTrigger value="archives">Archives</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Runs</CardTitle>
              <CardDescription>
                Latest snapshot runs with status and pipeline information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <SnapshotRunsList
                runs={runs}
                selectedRunId={selectedRunId}
                onSelectRun={setSelectedRunId}
              />
            </CardContent>
          </Card>

          {selectedRunId && (
            <Card>
              <CardHeader>
                <CardTitle>Run Details</CardTitle>
                <CardDescription>
                  Pipeline details and timing for selected run
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SnapshotRunDetail runId={selectedRunId} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="archives" className="space-y-4">
          <ArchiveBrowser />
        </TabsContent>
      </Tabs>
    </div>
  )
}