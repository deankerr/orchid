'use client'

import { useState } from 'react'

import { usePaginatedQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'

import { CopyToClipboardButton } from '@/components/shared/copy-to-clipboard-button'
import { PageContainer, PageHeader, PageTitle } from '@/components/shared/page-container'
import { Pill } from '@/components/shared/pill'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ITEMS_PER_PAGE = 50

type EntityType = 'all' | 'model' | 'endpoint' | 'provider'

export function ChangesListDevPage() {
  const [activeTab, setActiveTab] = useState<EntityType>('all')
  const [includeHidden, setIncludeHidden] = useState(false)

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
          includeHidden={includeHidden}
          setIncludeHidden={setIncludeHidden}
        />
        <ChangesResults entityType={activeTab} includeHidden={includeHidden} />
      </div>
    </PageContainer>
  )
}

function ChangesFilters({
  activeTab,
  setActiveTab,
  includeHidden,
  setIncludeHidden,
}: {
  activeTab: EntityType
  setActiveTab: (tab: EntityType) => void
  includeHidden: boolean
  setIncludeHidden: (include: boolean) => void
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
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="model">Models</SelectItem>
            <SelectItem value="endpoint">Endpoints</SelectItem>
            <SelectItem value="provider">Providers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="include-hidden" checked={includeHidden} onCheckedChange={setIncludeHidden} />
        <Label htmlFor="include-hidden" className="text-sm font-medium">
          Include hidden changes
        </Label>
      </div>
    </div>
  )
}

function ChangesResults({
  entityType,
  includeHidden,
}: {
  entityType: EntityType
  includeHidden: boolean
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.views.changes.list,
    {
      entity_type: entityType === 'all' ? undefined : entityType,
      include_hidden: includeHidden,
    },
    { initialNumItems: ITEMS_PER_PAGE },
  )

  if (status === 'LoadingFirstPage') {
    return <div className="p-4">Loading changes...</div>
  }

  if (!results || results.length === 0) {
    return (
      <div className="p-4 text-muted-foreground">
        No changes found for {entityType === 'all' ? 'any entity type' : entityType}
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

function ChangeRow({ change }: { change: Doc<'or_changes'> }) {
  const actionVariants = {
    create: 'primary' as const,
    delete: 'destructive' as const,
    update: 'secondary' as const,
  }

  const formatCrawlTime = (crawlId: string) => {
    const timestamp = parseInt(crawlId)
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div
      className={`space-y-2 rounded border p-3 ${!change.is_display ? 'border-dashed opacity-60' : ''}`}
    >
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={actionVariants[change.change_action]}>{change.change_action}</Badge>
        <Badge variant="outline">{change.entity_type}</Badge>
        {!change.is_display && <Badge variant="secondary">hidden</Badge>}
        <span className="font-medium">{change.entity_display_name}</span>
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

      {change.change_action === 'update' && change.change_root_key && (
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-xs">
            {change.change_root_key}

            <div className="text-muted-foreground">
              {change.model_variant_slug} {change.provider_slug}
            </div>
          </div>

          {change.change_body && (
            <pre className="overflow-x-auto rounded bg-muted p-1.5 text-xs">
              {JSON.stringify(change.change_body, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
