'use client'

import React from 'react'

import { usePaginatedQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'

import { PageHeader, PageTitle } from '@/components/app-layout/pages'
import { ModelCard, ProviderCard } from '@/components/shared/entity-card'
import { PaginatedLoadButton } from '@/components/shared/paginated-load-button'
import { RadBadge } from '@/components/shared/rad-badge'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatRelativeTime } from '@/lib/formatters'
import { groupBy } from '@/lib/grouping'
import { cn } from '@/lib/utils'

import { ChangePair, MonoBadge } from './_components/values'

export default function Page() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.feed.changesByCrawlId,
    {},
    { initialNumItems: 50 },
  )

  const grouped = results.map(({ crawl_id, data: changes }) => ({
    crawl_id,
    count: changes.length,
    group: groupBy(changes, (change) => change.provider_tag_slug).map(
      ({ key: provider_tag_slug, items: providerChanges }) => ({
        provider_tag_slug,
        group: groupBy(providerChanges, (change) => change.model_slug).map(
          ({ key: model_slug, items }) => ({
            model_slug,
            changes: items.toSorted((a, b) => (a.path ?? '').localeCompare(b.path ?? '')),
          }),
        ),
      }),
    ),
  }))

  return (
    <>
      <PageHeader>
        <PageTitle>Endpoint Changes Feed (preview) [{results.length}]</PageTitle>
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
          <PaginatedLoadButton status={status} onClick={() => loadMore(1)} />
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
