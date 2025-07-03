'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Archive, Eye } from 'lucide-react'

import { useSnapshotRuns, useSnapshotArchiveTypes } from '@/hooks/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ArchiveViewer } from './archive-viewer'
import { formatSnapshotAtTime } from '@/lib/utils'

interface ArchiveBrowserProps {
  onSelectArchive?: (archiveId: string) => void
}

export function ArchiveBrowser({ onSelectArchive }: ArchiveBrowserProps) {
  const [selectedSnapshotAt, setSelectedSnapshotAt] = useState<number | null>(null)
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null)
  const runs = useSnapshotRuns(50)
  const archiveTypes = useSnapshotArchiveTypes(selectedSnapshotAt || 0)

  if (!runs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Get successful runs with archives
  const successfulRuns = runs.filter(run => run.ok && run.ended_at)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Archive Browser</h3>
          <p className="text-sm text-muted-foreground">
            Browse archived data from successful snapshot runs
          </p>
        </div>
        <Badge variant="outline">{successfulRuns.length} runs with archives</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Snapshot Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Snapshot</CardTitle>
            <CardDescription>Choose a snapshot to view its archived data</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <div className="space-y-2 p-6">
                {successfulRuns.map((run) => (
                  <Button
                    key={run._id}
                    variant={selectedSnapshotAt === run.snapshot_at ? "secondary" : "ghost"}
                    className="w-full justify-start p-3 h-auto text-left"
                    onClick={() => setSelectedSnapshotAt(run.snapshot_at)}
                  >
                    <div className="flex items-start gap-3 w-full">
                                              <Archive className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs font-mono bg-muted px-1 rounded">
                              {formatSnapshotAtTime(run.snapshot_at)}
                            </code>
                            <Badge variant="outline" className="text-xs">Success</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                          </div>
                        </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Archive Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Archives</CardTitle>
            <CardDescription>
              {selectedSnapshotAt ? 'Archive types for selected snapshot' : 'Select a snapshot to view archives'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedSnapshotAt ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground mb-4">
                  Snapshot: {formatSnapshotAtTime(selectedSnapshotAt)}
                </div>
                
                {/* Real archive types from database */}
                {archiveTypes && archiveTypes.length > 0 ? (
                  archiveTypes.map((archiveType: any) => (
                    <div key={archiveType.type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{archiveType.type}</div>
                        <div className="text-xs text-muted-foreground">
                          {archiveType.count} archive{archiveType.count !== 1 ? 's' : ''} • {Math.round(archiveType.totalSize / 1024)} KB total
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Create archiveId in format "snapshot_at:type"
                          const archiveId = `${selectedSnapshotAt}:${archiveType.type}`
                          setSelectedArchiveId(archiveId)
                          if (onSelectArchive) {
                            onSelectArchive(archiveId)
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ))
                ) : selectedSnapshotAt ? (
                  <div className="text-center text-muted-foreground py-8">
                    No archives found for this snapshot
                  </div>
                ) : null}
                
                <Separator />
                
                <div className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Archive viewing uses the HTTP endpoint at{' '}
                  <code className="bg-muted px-1 rounded">
                    /archives?snapshot_at={selectedSnapshotAt}&type=models
                  </code>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-center text-muted-foreground">
                Select a snapshot from the list to view its archived data types
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedArchiveId && (
        <Card>
          <CardHeader>
            <CardTitle>Archive Data</CardTitle>
            <CardDescription>
              Viewing archive content for {selectedArchiveId.replace(':', ' - ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArchiveViewer archiveId={selectedArchiveId} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}