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
  const changesToShow = expanded ? item.all_changes : item.preview_changes

  return (
    <div className="min-w-0 space-y-2 border-l-2 border-muted py-1 pl-4">
      {/* * Provider header */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold">{item.provider_tag_slug}</span>
      </div>

      {/* Change list */}
      <div className="space-y-4">
        {changesToShow.map((change) => (
          <ChangeItem key={change._id} change={change} />
        ))}
      </div>

      {/* Expand/collapse button */}
      {item.has_more && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded
            ? 'Show less'
            : `Show ${item.total_count - 5} more ${item.total_count - 5 === 1 ? 'change' : 'changes'}`}
        </button>
      )}
    </div>
  )
}
