'use client'

import { useEffect, useState } from 'react'

import { formatDistanceToNow } from 'date-fns'
import {
  AlertTriangle,
  Archive,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Eye,
  XCircle,
} from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { useSnapshotArchives, useSnapshotRunById } from '@/hooks/api'

import { ArchiveViewer } from './archive-viewer'

interface SnapshotRunDetailProps {
  runId: string
}

function formatDuration(startedAt: number, endedAt?: number) {
  if (!endedAt) {
    return `${Math.round((Date.now() - startedAt) / 1000)}s (running)`
  }
  return `${Math.round((endedAt - startedAt) / 1000)}s`
}

function getEntityBadges(entities: any[]) {
  return entities.map((entity: any, idx: number) => (
    <Badge key={idx} variant="outline" className="text-xs">
      {entity.name}
      {entity.stable && <span className="ml-1 text-green-600">✓{entity.stable}</span>}
      {entity.insert && <span className="ml-1 text-blue-600">+{entity.insert}</span>}
      {entity.update && <span className="ml-1 text-yellow-600">~{entity.update}</span>}
    </Badge>
  ))
}

function getAllIssues(metrics: any): any[] {
  if (!metrics) return []

  const metricsArray = Array.isArray(metrics) ? metrics : [metrics]
  const allIssues: any[] = []

  metricsArray.forEach((metric: any) => {
    if (metric.issues && metric.issues.length > 0) {
      allIssues.push(...metric.issues)
    }
  })

  return allIssues
}

function getPipelineIcon(pipeline: any) {
  if (!pipeline.ok) {
    return <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
  }

  const issues = getAllIssues(pipeline.metrics)
  if (issues.length > 0) {
    return <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
  }

  return <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
}

function getAllEntities(metrics: any): any[] {
  if (!metrics) return []

  const metricsArray = Array.isArray(metrics) ? metrics : [metrics]
  const allEntities: any[] = []

  metricsArray.forEach((metric: any) => {
    if (metric.entities) {
      allEntities.push(...metric.entities)
    }
  })

  return allEntities
}

function getPipelineDuration(metrics: any): string {
  if (!metrics) return ''

  const metricsArray = Array.isArray(metrics) ? metrics : [metrics]
  let earliestStart = Number.MAX_SAFE_INTEGER
  let latestEnd = 0

  metricsArray.forEach((metric: any) => {
    if (metric.started_at) {
      earliestStart = Math.min(earliestStart, metric.started_at)
    }
    if (metric.ended_at) {
      latestEnd = Math.max(latestEnd, metric.ended_at)
    }
  })

  if (earliestStart === Number.MAX_SAFE_INTEGER || latestEnd === 0) return ''

  return `${Math.round((latestEnd - earliestStart) / 1000)}s`
}

export function SnapshotRunDetail({ runId }: SnapshotRunDetailProps) {
  const [expandedPipelines, setExpandedPipelines] = useState<Set<string>>(new Set())
  const [selectedArchive, setSelectedArchive] = useState<string | null>(null)

  const run = useSnapshotRunById(runId)
  const archives = useSnapshotArchives(run?.snapshot_at || 0)

  // Reset selected archive when runId changes
  useEffect(() => {
    setSelectedArchive(null)
  }, [runId])

  const togglePipeline = (pipelineName: string) => {
    const newExpanded = new Set(expandedPipelines)
    if (newExpanded.has(pipelineName)) {
      newExpanded.delete(pipelineName)
    } else {
      newExpanded.add(pipelineName)
    }
    setExpandedPipelines(newExpanded)
  }

  if (!run) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }
  const hasArchives = run.ok && run.ended_at && archives && archives.length > 0

  return (
    <div className="space-y-6">
      {/* Run Summary Header - Compact overview of the selected run */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        {/* Left side: Status badges and metadata */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Run status badge */}
            {!run.ended_at ? (
              <Badge variant="secondary">Running</Badge>
            ) : run.ok ? (
              <Badge variant="default" className="bg-green-600">
                Success
              </Badge>
            ) : (
              <Badge variant="destructive">Failed</Badge>
            )}
            {/* Archive availability indicator */}
            {hasArchives && (
              <Badge variant="outline" className="text-xs">
                <Archive className="mr-1 h-3 w-3" />
                {archives.length} archives
              </Badge>
            )}
          </div>
          {/* Run timing and pipeline summary */}
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })} •{' '}
            {formatDuration(run.started_at, run.ended_at)} • {run.pipelines.length} pipelines
            {run.pipelines.filter((p) => !p.ok).length > 0 && (
              <span className="text-red-600">
                {' '}
                • {run.pipelines.filter((p) => !p.ok).length} failed
              </span>
            )}
          </div>
        </div>
        {/* Right side: Snapshot timestamp */}
        <div className="font-mono text-sm text-muted-foreground">{run.snapshot_at}</div>
      </div>

      {/* Pipelines Section - Detailed view of each pipeline's execution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipelines</CardTitle>
          <CardDescription>
            Status and metrics for each pipeline in the snapshot process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {run.pipelines.map((pipeline, index) => {
            const entities = getAllEntities(pipeline.metrics)
            const issues = getAllIssues(pipeline.metrics)
            const duration = getPipelineDuration(pipeline.metrics)

            return (
              <div key={index} className="rounded-lg border">
                {/* Pipeline Header - Icon, name, duration, and entity badges */}
                <div className="flex items-start gap-3 p-3">
                  {/* Pipeline status icon - aligned to top */}
                  <div className="mt-0.5">{getPipelineIcon(pipeline)}</div>

                  {/* Pipeline content area */}
                  <div className="min-w-0 flex-1">
                    {/* Pipeline name and metadata row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium">{pipeline.name}</span>
                      {/* Duration badge */}
                      {duration && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          {duration}
                        </Badge>
                      )}
                      {/* Entity count and change indicators */}
                      {entities.length > 0 && (
                        <div className="flex flex-wrap gap-1">{getEntityBadges(entities)}</div>
                      )}
                    </div>

                    {/* Issues display - using Alert component for proper containment */}
                    {issues.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {issues.map((issue: any, idx: number) => (
                          <Alert key={idx} className="text-amber-500">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              {/* Issue header with type and indices */}
                              <div className="mb-1 space-y-1">
                                <div className="font-mono text-sm font-medium">{issue.type}</div>
                                {/* Issue message */}
                                <div className="text-sm">{issue.message}</div>
                                {issue.indices && (
                                  <div className="text-xs text-muted-foreground">
                                    at: {issue.indices.join(', ')}
                                  </div>
                                )}
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Display - Full-width error details if pipeline failed */}
                {pipeline.error && (
                  <div className="border-t px-3 pb-3">
                    <div className="pt-3">
                      <Alert className="border-red-200 bg-red-50">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription>
                          <div className="mb-1 font-medium text-red-700">Pipeline Error</div>
                          <div className="font-mono text-sm break-words text-red-600">
                            {pipeline.error}
                          </div>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Archives Section - Grid of available archives from this run */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Archives</CardTitle>
          <CardDescription>
            {hasArchives
              ? 'Archived data from this successful snapshot run'
              : 'No archives available for this run'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasArchives ? (
            /* Archive selection grid */
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {archives.map((archive) => (
                <Button
                  key={archive._id}
                  variant={
                    selectedArchive === `${run.snapshot_at}:${archive.type}` ? 'default' : 'outline'
                  }
                  className="h-auto flex-col p-3"
                  onClick={() => {
                    const archiveId = `${run.snapshot_at}:${archive.type}`
                    setSelectedArchive(archiveId)
                  }}
                >
                  <Archive className="mb-1 h-4 w-4" />
                  <div className="text-xs font-medium">{archive.type}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(archive.size / 1024)} KB
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            /* Empty state for runs without archives */
            <div className="flex h-32 items-center justify-center text-center text-muted-foreground">
              <div>
                <Archive className="mx-auto mb-2 h-8 w-8" />
                <div className="text-sm">No archives available</div>
                <div className="text-xs">Archives are only available for successful runs</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive Viewer - Full-width JSON data display for selected archive */}
      {selectedArchive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Archive Data</CardTitle>
            <CardDescription>
              Viewing content for {selectedArchive.replace(':', ' - ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArchiveViewer archiveId={selectedArchive} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
