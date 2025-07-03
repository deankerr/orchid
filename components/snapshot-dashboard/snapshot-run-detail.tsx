'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, XCircle, Clock, Archive, ChevronDown, ChevronRight } from 'lucide-react'

import { useSnapshotRunById, useSnapshotArchives } from '@/hooks/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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

export function SnapshotRunDetail({ runId }: SnapshotRunDetailProps) {
  const [expandedPipelines, setExpandedPipelines] = useState<Set<string>>(new Set())
  const [selectedArchive, setSelectedArchive] = useState<string | null>(null)
  const [showArchives, setShowArchives] = useState(false)
  
  const run = useSnapshotRunById(runId)
  const archives = useSnapshotArchives(run?.snapshot_at || 0)

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Run Summary */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Run Summary</h3>
          {!run.ended_at ? (
            <Badge variant="secondary">Running</Badge>
          ) : run.ok ? (
            <Badge variant="default" className="bg-green-600">Success</Badge>
          ) : (
            <Badge variant="destructive">Failed</Badge>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-16">Started:</span>
            <code className="text-xs">
              {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16">Duration:</span>
            <code className="text-xs">
              {formatDuration(run.started_at, run.ended_at)}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16">Pipelines:</span>
            <code className="text-xs">
              {run.pipelines.length} total, {run.pipelines.filter(p => !p.ok).length} failed
            </code>
          </div>
        </div>
      </div>

      <Separator />

      {/* Pipelines */}
      <div className="space-y-2">
        <h3 className="font-medium">Pipelines</h3>
        <div className="space-y-1">
          {run.pipelines.map((pipeline, index) => (
            <Collapsible key={index}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-2 h-auto text-left"
                  onClick={() => togglePipeline(pipeline.name)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {expandedPipelines.has(pipeline.name) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    
                    {pipeline.ok ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    
                    <span className="font-mono text-sm">{pipeline.name}</span>
                  </div>
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pl-8 pb-2">
                <div className="space-y-2">
                  {pipeline.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded font-mono">
                      {pipeline.error}
                    </div>
                  )}
                  
                  {pipeline.metrics && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <pre className="whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(pipeline.metrics, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      {/* Archives */}
      {archives && archives.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Archives</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchives(!showArchives)}
              >
                <Archive className="h-4 w-4 mr-1" />
                {archives.length} archives
                {showArchives ? (
                  <ChevronDown className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </Button>
            </div>
            
            {showArchives && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {archives.map((archive) => (
                    <Button
                      key={archive._id}
                      variant="outline"
                      className="justify-start p-2 h-auto text-left"
                      onClick={() => setSelectedArchive(`${run.snapshot_at}:${archive.type}`)}
                    >
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{archive.type}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(archive.size / 1024)} KB
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
                
                {selectedArchive && (
                  <div className="mt-4">
                    <ArchiveViewer archiveId={selectedArchive} />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}