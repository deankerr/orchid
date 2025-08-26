'use client'

import { useState } from 'react'

import { usePaginatedQuery } from 'convex/react'

import type { IChange } from 'json-diff-ts'
import { ChevronRight, MinusIcon, PlusIcon } from 'lucide-react'

import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'

import { RawPricingProperty } from '@/components/shared/numeric-value'
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
import { cn } from '@/lib/utils'

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
                <SelectItem value="all">All</SelectItem>
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
            <div className="grid gap-4">
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
    <div className="min-w-0 space-y-4 rounded-sm border border-border/80 bg-card/50 p-4 text-card-foreground">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center gap-2">
          <Badge className="min-w-20 font-mono uppercase" variant="outline">
            {change.entity_type}
          </Badge>
          {change.change_action !== 'update' && (
            <Badge className="min-w-20 font-mono uppercase" variant="outline">
              {change.change_action}
            </Badge>
          )}
          <div className="text-sm text-muted-foreground sm:hidden">
            {formatCrawlTime(change.crawl_id)}
          </div>
        </div>
        <span className="font-medium sm:flex-1">{change.entity_display_name}</span>
        <div className="hidden text-sm text-muted-foreground sm:block">
          {formatCrawlTime(change.crawl_id)}
        </div>
      </div>

      {shouldShowChangeBody && (
        <div className="font-mono text-sm">
          <ChangeBody change_body={change.change_body as IChangeS} parentKey="" />
        </div>
      )}
    </div>
  )
}

function ChangeBody({ change_body, parentKey }: { change_body: IChangeS; parentKey: string }) {
  const { changes, embeddedKey, key, type, oldValue, value } = change_body
  const currentPath = parentKey ? `${parentKey}.${key}` : key

  if (changes === undefined) {
    return (
      <ValueChangeItem
        changeKey={key}
        changeType={type}
        oldValue={oldValue}
        value={value}
        parentKey={parentKey}
      />
    )
  }

  if (embeddedKey) {
    const values = changes.map((c) => ({
      type: c.type as 'ADD' | 'REMOVE',
      value: String(c.value),
    }))
    return <ArrayChangeItem changeKey={key} values={values} />
  }

  return (
    <div className="space-y-2">
      <Badge variant="secondary">{key}</Badge>
      {changes.map((c) => (
        <div key={c.key} className="">
          <ChangeBody change_body={c} parentKey={currentPath} />
        </div>
      ))}
    </div>
  )
}

function ArrayChangeItem({
  changeKey,
  values,
}: {
  changeKey: string
  values: Array<{ type: 'ADD' | 'REMOVE'; value: string }>
}) {
  return (
    <div className="flex gap-2">
      <ChangeKey>{changeKey}</ChangeKey>
      <div className="flex flex-wrap items-center gap-1">
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

function ValueChangeItem({
  changeKey,
  changeType,
  oldValue,
  value,
  parentKey,
}: {
  changeKey: string
  changeType: 'ADD' | 'UPDATE' | 'REMOVE'
  oldValue: any
  value: any
  parentKey: string
}) {
  const [fromValue, toValue] = changeType === 'REMOVE' ? [value, oldValue] : [oldValue, value]
  const isPricing = parentKey === 'pricing'

  const renderChangeValue = (val: any) => {
    if (isPricing) {
      return <RawPricingProperty rawKey={changeKey} value={val} className="text-center" />
    }
    if (val === null) {
      return <span className="text-muted-foreground">null</span>
    }

    if (val === undefined) {
      return <span className="text-muted-foreground">undefined</span>
    }

    if (val === '') {
      return <span className="text-muted-foreground">empty</span>
    }

    if (typeof val === 'object') {
      return (
        <pre className="text-xs leading-relaxed break-words whitespace-pre-wrap">
          {JSON.stringify(val, null, 2)}
        </pre>
      )
    }

    if (typeof val === 'number') {
      return <span className="">{val.toLocaleString()}</span>
    }

    // Handle long strings with better wrapping
    const stringValue = String(val)
    if (stringValue.length > 100) {
      return <div className="leading-relaxed break-words whitespace-pre-wrap">{stringValue}</div>
    }

    return <span className="">{stringValue}</span>
  }

  // Determine if content is large enough to warrant stacking
  const isLargeContent = (val: any) => {
    if (typeof val === 'string' && val.length > 50) return true
    if (typeof val === 'object' && val !== null) return true
    return false
  }

  const shouldStack = isLargeContent(fromValue) || isLargeContent(toValue)

  return (
    <div
      className={cn(
        'flex gap-2',
        shouldStack ? 'flex-col sm:flex-row sm:items-center' : 'items-center',
      )}
    >
      <ChangeKey>{changeKey}</ChangeKey>
      <div
        className={cn(
          'flex min-w-0 flex-1 gap-2',
          shouldStack ? 'flex-col sm:flex-row sm:items-center' : 'items-center',
        )}
      >
        <ChangeValue key="from">{renderChangeValue(fromValue)}</ChangeValue>
        <ChevronRight
          className={cn(
            'w-5 flex-shrink-0 text-muted-foreground',
            shouldStack && 'rotate-90 self-center sm:rotate-0',
          )}
        />
        <ChangeValue key="to">{renderChangeValue(toValue)}</ChangeValue>
      </div>
    </div>
  )
}

function ChangeKey({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-sm border border-transparent bg-secondary px-2 py-1.5 text-right font-medium break-words text-secondary-foreground sm:w-56',
        className,
      )}
      {...props}
    />
  )
}

function ChangeValue({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'min-w-0 flex-1 self-stretch overflow-hidden rounded-sm border px-2.5 py-1.5 text-center',
        className,
      )}
      {...props}
    />
  )
}
