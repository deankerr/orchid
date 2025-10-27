'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { usePaginatedQuery } from 'convex/react'
import * as R from 'remeda'

import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'

import { PageHeader, PageTitle } from '@/components/app-layout/pages'
import { ModelCard, ProviderCard } from '@/components/shared/entity-card'
import { PaginatedLoadButton } from '@/components/shared/paginated-load-button'
import { PercentageBadge } from '@/components/shared/percentage-badge'
import { RadBadge } from '@/components/shared/rad-badge'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatPrice, formatRelativeTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'

function usePaginatedQueryWithMinItems() {
  const MIN_ITEMS_PER_LOAD = 20
  const MAX_ATTEMPTS = 10

  const { results, status, loadMore } = usePaginatedQuery(
    api.feed.changesByCrawlId,
    {},
    { initialNumItems: 1 },
  )
  const currentResultCount = results.flat().length

  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [targetCount, setTargetCount] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)

  const loadMoreWithMinItems = useCallback(() => {
    if (status !== 'CanLoadMore' || isLoadingMore) return

    const target = currentResultCount + MIN_ITEMS_PER_LOAD

    console.log('[PaginatedQuery] START_LOAD_CYCLE', {
      currentCount: currentResultCount,
      target,
      minItems: MIN_ITEMS_PER_LOAD,
    })

    setIsLoadingMore(true)
    setTargetCount(target)
    setAttempts(0)
    loadMore(1)
  }, [status, isLoadingMore, currentResultCount, loadMore])

  useEffect(() => {
    if (!isLoadingMore || targetCount === null) return

    console.log('[PaginatedQuery] CHECK_RESULTS', {
      currentCount: currentResultCount,
      targetCount,
      attempts,
      status,
      remaining: targetCount - currentResultCount,
    })

    if (currentResultCount >= targetCount) {
      console.log('[PaginatedQuery] TARGET_MET', {
        currentCount: currentResultCount,
        targetCount,
        attempts,
      })
      setIsLoadingMore(false)
      return
    }

    if (attempts >= MAX_ATTEMPTS || status === 'Exhausted') {
      console.log('[PaginatedQuery] EXHAUSTED', {
        attempt: attempts + 1,
        maxAttempts: MAX_ATTEMPTS,
      })
      setIsLoadingMore(false)
      return
    }

    setAttempts((prev) => prev + 1)
    console.log('[PaginatedQuery] RETRYING', { attempt: attempts + 1, maxAttempts: MAX_ATTEMPTS })
    loadMore(1)
  }, [currentResultCount, targetCount, isLoadingMore, status, attempts, loadMore])

  return {
    results,
    status: isLoadingMore ? ('LoadingMore' as const) : status,
    loadMore: loadMoreWithMinItems,
    isLoadingMore,
  }
}

export default function Page() {
  const { results, status, loadMore } = usePaginatedQueryWithMinItems()

  const endpointChanges = results.flat() // TODO use stream grouping

  const grouped = Map.groupBy(endpointChanges, (c) => c.crawl_id)
    .entries()
    .map(([crawl_id, changes]) => ({
      crawl_id,
      count: changes.length,
      group: Map.groupBy(changes, (change) => change.provider_tag_slug)
        .entries()
        .map(([provider_tag_slug, changes]) => ({
          provider_tag_slug,
          group: Map.groupBy(changes, (change) => change.model_slug)
            .entries()
            .map(([model_slug, changes]) => ({
              model_slug,
              changes: changes.toSorted((a, b) => (a.path ?? '').localeCompare(b.path ?? '')),
            }))
            .toArray(),
        }))
        .toArray(),
    }))
    .toArray()

  return (
    <>
      <PageHeader>
        <PageTitle>Endpoint Changes Feed (preview)</PageTitle>
      </PageHeader>

      <div className="space-y-8 px-4 py-6">
        {grouped.map(({ crawl_id, count, group }) => (
          // * crawl_id group
          <div key={crawl_id} className="mx-auto max-w-5xl space-y-7">
            {/* Timeline marker */}
            <div className="flex items-center gap-2 font-mono">
              <Badge>{formatRelativeTime(Number(crawl_id))}</Badge>
              <Badge variant="secondary">{formatDateTime(Number(crawl_id))}</Badge>
              <div className="h-px flex-1 bg-border" />
              <div className="text-[10px] text-muted-foreground">{count}</div>
            </div>

            <div className="mx-auto max-w-4xl space-y-6 px-2">
              {group.map(({ provider_tag_slug, group }) => (
                <EntityGroupCard
                  key={provider_tag_slug}
                  entity={<ProviderCard slug={provider_tag_slug} />}
                >
                  {group.map(({ model_slug, changes }) => (
                    <EntityChangesetCard
                      key={model_slug}
                      changes={changes}
                      entity={<ModelCard slug={model_slug} />}
                    />
                  ))}
                </EntityGroupCard>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-center py-4">
          <PaginatedLoadButton status={status} onClick={() => loadMore()} />
        </div>
      </div>
    </>
  )
}

function EntityGroupCard({
  entity,
  children,
  className,
  ...props
}: {
  entity: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-sm border border-dashed', className)} {...props}>
      <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-dashed p-3">
        {entity}
        <MonoBadge className="h-fit rounded-sm">PROVIDER</MonoBadge>
      </div>

      <div className="space-y-4 px-4 py-4 md:columns-2">{children}</div>
    </div>
  )
}

function EntityChangesetCard({
  changes,
  entity,
  className,
  ...props
}: {
  changes: Doc<'or_views_changes'>[]
  entity: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'max-w-full break-inside-avoid rounded-sm border border-border/80 bg-card/50',
        className,
      )}
      {...props}
    >
      <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-border/80 p-3 py-3.5">
        {entity}
        <MonoBadge className="h-fit rounded-sm">ENDPOINT</MonoBadge>
      </div>

      {/* * changes */}
      <div className="divide-y divide-border/50 [&>div]:py-3.5">
        {changes.map((change) =>
          change.change_kind === 'update' ? (
            <div key={change._id} className="space-y-2 px-4 text-sm">
              {/* * path */}
              <div className="font-mono text-[90%]">{change.path}</div>
              {/* * change values */}
              <ChangePair change={change} />
            </div>
          ) : (
            <div key={change._id} className="px-4 text-center text-sm">
              {change.change_kind === 'create' && (
                <RadBadge variant="surface" color="green" className="px-3 py-1 font-mono">
                  CREATED
                </RadBadge>
              )}

              {change.change_kind === 'delete' && (
                <RadBadge variant="surface" color="red" className="px-3 py-1 font-mono">
                  DELETED
                </RadBadge>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  )
}

function ChangePair({ change }: { change: Doc<'or_views_changes'> }) {
  const { before, after, path_level_1, path_level_2 } = change

  // Handle array diffs
  if (Array.isArray(before) && Array.isArray(after)) {
    return <ArrayDiff before={before} after={after} />
  }

  const showPercentage = R.isNumber(before) && R.isNumber(after) && before !== 0

  const percentageChange = showPercentage ? ((after - before) / before) * 100 : null

  const shouldInvert = path_level_1 === 'pricing'

  return (
    <div className="flex flex-wrap items-center gap-3 *:data-[slot=badge]:min-w-24 *:data-[slot=badge]:py-1 *:data-[slot=badge]:text-sm">
      <ChangeValue value={before} path_level_1={path_level_1} path_level_2={path_level_2} />
      <span className="shrink-0 text-base text-muted-foreground">{'-->'}</span>
      <ChangeValue value={after} path_level_1={path_level_1} path_level_2={path_level_2} />
      {showPercentage && (
        <div>
          <PercentageBadge
            className="py-1 text-sm"
            value={percentageChange}
            invert={shouldInvert}
          />
        </div>
      )}
    </div>
  )
}

function ChangeValue({
  value,
  path_level_1 = '',
  path_level_2 = '',
}: {
  value: unknown
  path_level_1?: string
  path_level_2?: string
}) {
  if (R.isNumber(value)) {
    const priceKey = path_level_1 === 'pricing' ? path_level_2 : undefined
    return <NumericValue value={value} priceKey={priceKey} />
  }

  if (R.isString(value)) return <StringValue value={value} />
  if (R.isBoolean(value)) return <BooleanValue value={value} />
  if (value === null) return <NullValue />
  if (value === undefined) return <UndefinedValue />

  return <JSONValue value={value} />
}

function NumericValue({ value, priceKey }: { value: number; priceKey?: string }) {
  const formatted = priceKey
    ? formatPrice({
        priceKey,
        priceValue: value,
        unitSuffix: priceKey === 'discount',
      })
    : value.toLocaleString()
  return (
    <Badge className="font-mono" variant="secondary" title={String(value)}>
      {formatted}
    </Badge>
  )
}

function StringValue({ value }: { value: string }) {
  if (value === '') return <EmptyStringValue />
  if (value.length >= 60) return <JSONValue value={value} />

  const hasUppercase = value.match(/[A-Z]/)
  const hasSpace = value.match(/\s/)

  return (
    <Badge variant="secondary" className={cn(!hasUppercase && !hasSpace && 'font-mono')}>
      {value}
    </Badge>
  )
}

function EmptyStringValue() {
  return <MonoBadge className="opacity-50">empty</MonoBadge>
}

function BooleanValue({ value }: { value: boolean }) {
  return <MonoBadge>{value ? 'true' : 'false'}</MonoBadge>
}

function NullValue() {
  return <MonoBadge>null</MonoBadge>
}

function UndefinedValue() {
  return <MonoBadge className="border-dashed">undefined</MonoBadge>
}

function JSONValue({ value }: { value: unknown }) {
  const stringified = JSON.stringify(value, null, 2)
  return (
    <pre className="max-h-40 max-w-1/2 overflow-auto rounded bg-muted/40 p-2 text-xs">
      {stringified}
    </pre>
  )
}

function MonoBadge({ children, className, ...props }: React.ComponentProps<typeof Badge>) {
  return (
    <Badge variant="outline" className={cn('text-muted-foreground', className)} {...props}>
      <span className="font-mono text-[90%]">{children}</span>
    </Badge>
  )
}

function ArrayDiff({ before, after }: { before: unknown[]; after: unknown[] }) {
  const beforeSet = new Set(before.map(String))
  const afterSet = new Set(after.map(String))
  const allItems = Array.from(new Set([...before.map(String), ...after.map(String)])).sort()

  return (
    <div className="flex flex-wrap gap-1.5 font-mono">
      {allItems.map((item) => {
        const inBefore = beforeSet.has(item)
        const inAfter = afterSet.has(item)

        // Unchanged
        if (inBefore && inAfter) {
          return (
            <Badge key={item} variant="outline" className="text-muted-foreground">
              {item}
            </Badge>
          )
        }

        // Removed
        if (inBefore) {
          return (
            <Badge
              key={item}
              className="border-negative-surface-border bg-negative-surface text-negative-surface-foreground line-through"
            >
              {item}
            </Badge>
          )
        }

        // Added
        return (
          <Badge
            key={item}
            className="border-positive-surface-border bg-positive-surface text-positive-surface-foreground"
          >
            + {item}
          </Badge>
        )
      })}
    </div>
  )
}
