'use client'

import { useEffect, useState } from 'react'

import { Download } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getConvexHttpUrl } from '@/lib/utils'

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

  // Fetch archive data from HTTP endpoint
  useEffect(() => {
    async function fetchArchive() {
      if (!archiveId) return

      setLoading(true)
      setError(null)

      try {
        // archiveId format: "snapshot_at:type" for simplicity
        const [snapshotAtStr, type] = archiveId.split(':')
        const snapshot_at = parseInt(snapshotAtStr)

        if (isNaN(snapshot_at) || !type) {
          setError('Invalid archive ID format. Expected "snapshot_at:type"')
          return
        }

        const url = getConvexHttpUrl(`/archives?snapshot_at=${snapshot_at}&type=${type}`)
        const response = await fetch(url)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.json()

        if (Array.isArray(data) && data.length > 0) {
          setArchiveData(data[0]) // Use first result
        } else {
          setError('No archive data found')
        }
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
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="text-sm text-red-600">{error}</div>
      </div>
    )
  }

  if (!archiveData) {
    return (
      <div className="rounded-md bg-muted p-4">
        <div className="text-sm text-muted-foreground">No archive data available</div>
      </div>
    )
  }

  const { archive, data } = archiveData

  // Get data summary for metadata
  const getDataSummary = () => {
    if (Array.isArray(data)) {
      return `${data.length} items`
    }
    if (typeof data === 'object' && data !== null) {
      return `${Object.keys(data).length} keys`
    }
    return typeof data
  }

  return (
    <div className="space-y-4">
      {/* Archive Metadata */}
      <div className="flex items-center justify-between rounded-lg bg-muted p-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{archive.type}</Badge>
            <span className="font-mono text-sm">{Math.round(archive.size / 1024)} KB</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{getDataSummary()}</span>
          </div>
          <Badge variant="outline">sha256: {archive.sha256.slice(0, 7)}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
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
      <div className="rounded-lg border">
        <pre className="overflow-x-auto p-4 font-mono text-sm whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}
