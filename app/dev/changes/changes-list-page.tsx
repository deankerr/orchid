'use client'

import { useState } from 'react'

import { usePaginatedQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'
import type { ChangesTableFields } from '@/convex/lib/changesTable'

import { CopyToClipboardButton } from '@/components/shared/copy-to-clipboard-button'
import { PageContainer, PageHeader, PageTitle } from '@/components/shared/page-container'
import { Pill } from '@/components/shared/pill'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ITEMS_PER_PAGE = 50

type EntityType = 'models' | 'endpoints' | 'providers'

export function ChangesListPage() {
  const [activeTab, setActiveTab] = useState<EntityType>('models')
  const [entityId, setEntityId] = useState('')

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Changes</PageTitle>
        <p className="text-muted-foreground">
          View changes detected between OpenRouter data snapshots
        </p>
      </PageHeader>

      <div className="space-y-3">
        <ChangesFilters
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          entityId={entityId}
          setEntityId={setEntityId}
        />
        <ChangesResults entityType={activeTab} entityId={entityId} />
      </div>
    </PageContainer>
  )
}

function ChangesFilters({
  activeTab,
  setActiveTab,
  entityId,
  setEntityId,
}: {
  activeTab: EntityType
  setActiveTab: (tab: EntityType) => void
  entityId: string
  setEntityId: (id: string) => void
}) {
  return (
    <div className="flex items-end gap-4">
      <div>
        <Label htmlFor="entity-type" className="text-sm font-medium">
          Entity Type
        </Label>
        <Select value={activeTab} onValueChange={(value) => setActiveTab(value as EntityType)}>
          <SelectTrigger id="entity-type" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="models">Models</SelectItem>
            <SelectItem value="endpoints">Endpoints</SelectItem>
            <SelectItem value="providers">Providers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Label htmlFor="entity-id" className="text-sm font-medium">
          Filter by Entity ID (optional)
        </Label>
        <Input
          id="entity-id"
          placeholder="Enter model slug, endpoint UUID, or provider slug"
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
        />
      </div>
    </div>
  )
}

function ChangesResults({ entityType, entityId }: { entityType: EntityType; entityId: string }) {
  const query =
    entityType === 'models'
      ? api.views.models.listChanges
      : entityType === 'endpoints'
        ? api.views.endpoints.listChanges
        : api.views.providers.listChanges

  const { results, status, loadMore } = usePaginatedQuery(
    query,
    {
      entity_id: entityId || undefined,
    },
    { initialNumItems: ITEMS_PER_PAGE },
  )

  if (status === 'LoadingFirstPage') {
    return <div className="p-4">Loading changes...</div>
  }

  if (!results || results.length === 0) {
    return (
      <div className="p-4 text-muted-foreground">
        No changes found{entityId ? ` for entity "${entityId}"` : ''}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {results.map((change, index) => (
          <ChangeRow key={index} change={change} />
        ))}
      </div>

      {status === 'CanLoadMore' && (
        <Button onClick={() => loadMore(ITEMS_PER_PAGE)} variant="outline" className="w-full">
          Load More
        </Button>
      )}

      {status === 'LoadingMore' && (
        <div className="p-4 text-center text-muted-foreground">Loading more changes...</div>
      )}
    </div>
  )
}

function ChangeRow({ change }: { change: ChangesTableFields }) {
  const eventTypeVariants = {
    add: 'default' as const,
    remove: 'destructive' as const,
    update: 'secondary' as const,
  }

  const formatCrawlTime = (crawlId: string) => {
    const timestamp = parseInt(crawlId)
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-2 rounded border p-3">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={eventTypeVariants[change.event_type]}>{change.event_type}</Badge>
        <span className="font-medium">{change.entity_name}</span>
        <CopyToClipboardButton
          value={change.entity_id}
          variant="ghost"
          size="icon"
          className="size-4"
        />

        <Pill label="crawl_id" className="ml-auto font-mono">
          {change.crawl_id}
        </Pill>
        <span className="text-muted-foreground">{formatCrawlTime(change.crawl_id)}</span>
      </div>

      {change.event_type === 'update' && 'change_key' in change && (
        <div className="space-y-2">
          <div className="font-mono text-xs">{change.change_key}</div>

          {change.change_raw && (
            <pre className="overflow-x-auto rounded bg-muted p-1.5 text-xs">
              {JSON.stringify(change.change_raw, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
