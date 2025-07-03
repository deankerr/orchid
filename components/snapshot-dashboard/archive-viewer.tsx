'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ArchiveViewerProps {
  archiveId: string
}

interface ArchiveRecord {
  type: string
  run_id: string
  size: number
  sha256: string
  _creationTime: number
}

interface ArchiveResponse {
  archive: ArchiveRecord
  data: any
}

export function ArchiveViewer({ archiveId }: ArchiveViewerProps) {
  const [archiveData, setArchiveData] = useState<ArchiveResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  // Get the archive by ID - we need to fetch from the HTTP endpoint
  // since we can't decompress in Convex queries
  useEffect(() => {
    async function fetchArchive() {
      if (!archiveId) return
      
      setLoading(true)
      setError(null)
      
      try {
        // We need to get the snapshot_at and type from the archive first
        // For now, we'll use the existing HTTP endpoint pattern
        // This is a simplified approach - in a real implementation, 
        // we'd need to enhance the backend to support ID-based lookups
        
        setError('Archive viewing not fully implemented yet. Need to enhance HTTP endpoint.')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch archive')
      } finally {
        setLoading(false)
      }
    }

    fetchArchive()
  }, [archiveId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="text-sm text-red-600">{error}</div>
      </div>
    )
  }

  if (!archiveData) {
    return (
      <div className="p-4 bg-muted rounded-md">
        <div className="text-sm text-muted-foreground">No archive data available</div>
      </div>
    )
  }

  const { archive, data } = archiveData

  return (
    <div className="space-y-4">
      {/* Archive Metadata */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{archive.type}</Badge>
            <span className="text-sm font-mono">{Math.round(archive.size / 1024)} KB</span>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            SHA256: {archive.sha256.slice(0, 16)}...
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showRaw ? 'Pretty' : 'Raw'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
              })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${archive.type}-${archive.run_id}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Data Display */}
      <div className="border rounded-lg">
        {showRaw ? (
          <ScrollArea className="h-96">
            <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(data, null, 2)}
            </pre>
          </ScrollArea>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b px-4">
              <TabsList className="h-9">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="sample" className="text-xs">Sample</TabsTrigger>
                <TabsTrigger value="raw" className="text-xs">Raw JSON</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="p-4 space-y-2">
              <div className="text-sm">
                <div className="font-medium mb-2">Data Summary</div>
                <div className="space-y-1 text-muted-foreground">
                  <div>Type: {typeof data}</div>
                  {Array.isArray(data) && (
                    <div>Items: {data.length}</div>
                  )}
                  {typeof data === 'object' && data !== null && !Array.isArray(data) && (
                    <div>Keys: {Object.keys(data).length}</div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sample" className="p-4">
              <ScrollArea className="h-64">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {Array.isArray(data) 
                    ? JSON.stringify(data.slice(0, 3), null, 2) + (data.length > 3 ? '\n\n... and ' + (data.length - 3) + ' more items' : '')
                    : JSON.stringify(data, null, 2)
                  }
                </pre>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="raw" className="p-0">
              <ScrollArea className="h-64">
                <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}