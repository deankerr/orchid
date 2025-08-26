'use client'

import { useState } from 'react'

import { usePaginatedQuery } from 'convex/react'

import type { IChange } from 'json-diff-ts'
import { ChevronRight, MinusIcon, PlusIcon } from 'lucide-react'

import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'

import { PageContainer, PageHeader, PageTitle } from '@/components/shared/page-container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

export function ChangesListPage() {
  const [entityType, setEntityType] = useState<EntityType>('all')

  const { results, status, loadMore } = usePaginatedQuery(
    api.views.changes.list,
    {
      entity_type: entityType === 'all' ? undefined : entityType,
      include_hidden: false, // End-users always see only displayable changes
    },
    { initialNumItems: ITEMS_PER_PAGE },
  )

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Changes</PageTitle>
        <p className="text-muted-foreground">View changes detected between OpenRouter snapshots</p>
      </PageHeader>

      <div className="space-y-4">
        <div className="flex items-end gap-4">
          <div>
            <Label htmlFor="entity-type" className="text-sm font-medium">
              Filter by Type
            </Label>
            <Select
              value={entityType}
              onValueChange={(value) => setEntityType(value as EntityType)}
            >
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
        </div>

        {status === 'LoadingFirstPage' ? (
          <div className="p-4">Loading changes...</div>
        ) : !results || results.length === 0 ? (
          <div className="p-4 text-muted-foreground">
            No changes found for {entityType === 'all' ? 'any type' : entityType}
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {results.map((change) => (
                <ChangeCard key={`${change._id}`} change={change} />
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
          </>
        )}
      </div>
    </PageContainer>
  )
}

type IChangeS = Omit<IChange, 'type' | 'changes'> & {
  type: 'ADD' | 'UPDATE' | 'REMOVE'
  changes?: IChangeS[]
}

function ChangeCard({ change }: { change: Doc<'or_changes'> }) {
  const actionVariants = {
    create: 'default' as const,
    delete: 'destructive' as const,
    update: 'secondary' as const,
  }

  const formatCrawlTime = (crawlId: string) => {
    const timestamp = parseInt(crawlId)
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const shouldShowChangeBody = change.change_action === 'update' && change.change_body

  return (
    <div className="space-y-8 rounded-md border bg-card p-4 text-card-foreground">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="min-w-20 font-mono uppercase" variant="outline">
            {change.entity_type}
          </Badge>
          <Badge
            className="min-w-20 font-mono uppercase"
            variant={actionVariants[change.change_action]}
          >
            {change.change_action}
          </Badge>
          <span className="font-medium">{change.entity_display_name}</span>
        </div>
        <div className="text-sm text-muted-foreground">{formatCrawlTime(change.crawl_id)}</div>
      </div>

      {shouldShowChangeBody && <ChangeBody change_body={change.change_body as IChangeS} />}
    </div>
  )
}

function ChangeBody({ change_body }: { change_body: IChangeS }) {
  const { changes, embeddedKey, key, type, oldValue, value } = change_body

  if (changes === undefined) {
    return <ValueChange changeKey={key} changeType={type} oldValue={oldValue} value={value} />
  }

  if (embeddedKey) {
    const values = changes.map((c) => ({
      type: c.type as 'ADD' | 'REMOVE',
      value: String(c.value),
    }))
    return <ArrayChanges changeKey={key} values={values} />
  }

  return (
    <div className="space-y-1">
      <div className="font-mono text-sm font-medium text-muted-foreground">{key}</div>
      {changes.map((c) => (
        <div key={c.key} className="ml-4">
          <ChangeBody change_body={c} />
        </div>
      ))}
    </div>
  )
}

function ArrayChanges({
  changeKey,
  values,
}: {
  changeKey: string
  values: Array<{ type: 'ADD' | 'REMOVE'; value: string }>
}) {
  return (
    <div className="flex gap-2 font-mono text-sm">
      <div className="font-medium text-muted-foreground">{changeKey}:</div>
      <div className="flex flex-wrap gap-1">
        {values.map((item, i) => (
          <Badge key={i} variant={item.type === 'REMOVE' ? 'destructive' : 'default'}>
            {item.type === 'ADD' && <PlusIcon className="mr-1 h-3 w-3" />}
            {item.type === 'REMOVE' && <MinusIcon className="mr-1 h-3 w-3" />}
            {item.value}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function ValueChange({
  changeKey,
  changeType,
  oldValue,
  value,
}: {
  changeKey: string
  changeType: 'ADD' | 'UPDATE' | 'REMOVE'
  oldValue: any
  value: any
}) {
  const [fromValue, toValue] = changeType === 'REMOVE' ? [value, oldValue] : [oldValue, value]

  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="min-w-28 text-right font-medium text-muted-foreground">{changeKey}:</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="">{renderValue(fromValue)}</span>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <span className="">{renderValue(toValue)}</span>
      </div>
    </div>
  )
}

function renderValue(value: any) {
  if (value === null) {
    return <span className="text-muted-foreground">null</span>
  }

  if (value === undefined) {
    return <span className="text-muted-foreground">undefined</span>
  }

  if (typeof value === 'object') {
    return <span className="">{JSON.stringify(value, null, 2)}</span>
  }

  return <span className="">{String(value)}</span>
}
