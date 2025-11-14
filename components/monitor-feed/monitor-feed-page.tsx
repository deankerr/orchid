'use client'

import Link from 'next/link'

import { usePaginatedQuery } from 'convex-helpers/react/cache/hooks'

import { api } from '@/convex/_generated/api'
import { ChangeDoc } from '@/convex/feed'

import { ChangeValuePair } from '@/components/monitor-feed/monitor-feed-values'
import { EntityAvatar } from '@/components/shared/entity-avatar'
import { PaginatedLoadButton } from '@/components/shared/paginated-load-button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { formatDateTime, formatRelativeTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export function MonitorFeed() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.feed.changesByCrawlId,
    {},
    { initialNumItems: 50, customPagination: true },
  )

  const viewportRef = useInfiniteScroll(() => loadMore(1), {
    hasMore: status === 'CanLoadMore',
    threshold: 1400,
  })

  return (
    <ScrollArea className="flex-1 border sm:rounded-md" viewportRef={viewportRef} maskHeight={10}>
      <div className="space-y-7 px-2 py-4 sm:px-3">
        {results.map(({ crawl_id, data: changes }) => (
          <div key={crawl_id} className="space-y-5 text-sm">
            <TimelineMarker crawl_id={crawl_id} />

            <ul className="ml-2 list-disc space-y-4 font-mono leading-loose text-muted-foreground sm:pl-2">
              {changes.map((change: ChangeDoc) => (
                <FeedItem key={change._id} change={change} />
              ))}
            </ul>
          </div>
        ))}

        <div className="flex items-center justify-center py-4">
          <PaginatedLoadButton status={status} onClick={() => loadMore(1)} />
        </div>
      </div>
    </ScrollArea>
  )
}

function TimelineMarker({ crawl_id, className }: { crawl_id: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge className="font-mono">{formatRelativeTime(Number(crawl_id))}</Badge>
      <Badge variant="secondary" className="rounded-md font-mono">
        {formatDateTime(Number(crawl_id))}
      </Badge>
      <div className="h-px flex-1 border-b border-dashed" />
    </div>
  )
}

function FeedItem({ change }: { change: ChangeDoc }) {
  const actionText =
    change.change_kind === 'create' ? (
      <span className="text-green-400">created</span>
    ) : change.change_kind === 'delete' ? (
      <span className="text-rose-400">removed</span>
    ) : (
      'updated: '
    )

  return (
    <li className="[&>span]:font-normal">
      {change.entity_type === 'model' && 'model '}
      {'provider_tag_slug' in change && (
        <Link
          href={`https://openrouter.ai/provider/${change.provider_slug}`}
          className="underline decoration-primary/40 decoration-dotted underline-offset-3 transition-colors duration-200 hover:decoration-primary/60"
        >
          <EntityBadgeInline slug={change.provider_tag_slug} />
        </Link>
      )}
      {change.entity_type === 'endpoint' && ' endpoint for '}
      {'model_slug' in change && (
        <Link
          href={`https://openrouter.ai/${change.model_slug}`}
          className="underline decoration-primary/40 decoration-dotted underline-offset-3 transition-colors duration-200 hover:decoration-primary/60"
        >
          <EntityBadgeInline slug={change.model_slug} />
        </Link>
      )}{' '}
      was {actionText}
      {change.change_kind === 'update' && (
        <>
          <Badge variant="outline" className="rounded-sm border-dashed text-sm text-foreground/80">
            {change.path}
          </Badge>{' '}
          <ChangeValuePair
            before={change.before}
            after={change.after}
            path_level_1={change.path_level_1}
            path_level_2={change.path_level_2}
          />
        </>
      )}
    </li>
  )
}

function EntityBadgeInline({ slug }: { slug: string }) {
  return (
    <span className="text-foreground">
      <EntityAvatar className="mr-1.5 size-4.5 align-text-bottom" slug={slug} />
      {slug}
    </span>
  )
}
