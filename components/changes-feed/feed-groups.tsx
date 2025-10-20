'use client'

import { useState } from 'react'

import type { FeedItem } from '@/convex/feed'

import { formatDateTime, formatRelativeTime } from '@/lib/formatters'

import { Badge } from '../ui/badge'
import { ChangeItem } from './change-item'

export function CrawlGroup({ crawl_id, items }: { crawl_id: string; items: FeedItem[] }) {
  const timestamp = Number.parseInt(crawl_id, 10)
  const relativeTime = Number.isFinite(timestamp) ? formatRelativeTime(timestamp) : crawl_id
  const localTime = Number.isFinite(timestamp) ? formatDateTime(timestamp) : crawl_id

  return (
    <div className="relative">
      {/* Timeline marker */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2 font-mono">
          <Badge>{relativeTime}</Badge>
          <Badge variant="secondary">{localTime}</Badge>
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Provider groups */}
      <div className="space-y-3 pl-4">
        {items.map((item, index) => (
          <ProviderChangeGroup key={`${item.provider_tag_slug}-${index}`} item={item} />
        ))}
      </div>
    </div>
  )
}

export function ProviderChangeGroup({ item }: { item: FeedItem }) {
  const [expanded, setExpanded] = useState(false)
  const previewCount = 5

  // Group changes by model_slug
  const modelGroups = new Map<string, typeof item.changes>()
  for (const change of item.changes) {
    if (!modelGroups.has(change.model_slug)) {
      modelGroups.set(change.model_slug, [])
    }
    modelGroups.get(change.model_slug)!.push(change)
  }

  const modelGroupsArray = Array.from(modelGroups.entries())
  const groupsToShow = expanded ? modelGroupsArray : modelGroupsArray.slice(0, previewCount)
  const hasMore = modelGroupsArray.length > previewCount

  return (
    <div className="min-w-0 space-y-2 border-l-2 border-muted py-1 pl-4">
      {/* * Provider header */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold">{item.provider_tag_slug}</span>
      </div>

      {/* Model groups */}
      <div className="space-y-4">
        {groupsToShow.map(([model_slug, changes]) => (
          <ModelChangeGroup key={model_slug} model_slug={model_slug} changes={changes} />
        ))}
      </div>

      {/* Expand/collapse button */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded
            ? 'Show less'
            : `Show ${modelGroupsArray.length - previewCount} more ${modelGroupsArray.length - previewCount === 1 ? 'model' : 'models'}`}
        </button>
      )}
    </div>
  )
}

function ModelChangeGroup({
  model_slug,
  changes,
}: {
  model_slug: string
  changes: FeedItem['changes']
}) {
  const endpoint_uuid = changes[0]?.endpoint_uuid

  // Determine if all changes have the same kind
  const changeKinds = new Set(changes.map((c) => c.change_kind))
  const uniformChangeKind = changeKinds.size === 1 ? changes[0]?.change_kind : null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-mono text-xs">
        <StatusBadge kind={uniformChangeKind} />
        <Badge variant="outline">{endpoint_uuid.slice(0, 4)}</Badge>
        <Badge variant="outline" className="border-transparent px-0 text-sm">
          {model_slug}
        </Badge>
      </div>

      <div className="space-y-3 pl-6">
        {changes.map((change) => (
          <ChangeItem key={change._id} change={change} />
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ kind }: { kind: 'create' | 'delete' | 'update' | null }) {
  if (kind === 'create') {
    return (
      <Badge className="border-positive-surface-border bg-positive-surface text-positive-surface-foreground">
        CREATED
      </Badge>
    )
  }

  if (kind === 'delete') {
    return (
      <Badge className="border-negative-surface-border bg-negative-surface text-negative-surface-foreground">
        DELETED
      </Badge>
    )
  }

  if (kind === 'update') {
    return (
      <Badge variant="outline" className="border-transparent text-muted-foreground">
        CHANGED
      </Badge>
    )
  }

  // Mixed or unknown - show nothing
  return null
}
