'use client'

import { usePaginatedQuery } from 'convex-helpers/react/cache/hooks'

import { api } from '@/convex/_generated/api'
import { EndpointChangeDoc } from '@/convex/feed'

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
    <ScrollArea className="flex-1" viewportRef={viewportRef} maskHeight={10}>
      <div className="space-y-4 p-4">
        {results.map(({ crawl_id, data: changes }) => (
          <div key={crawl_id} className="space-y-4 text-sm">
            <TimelineMarker crawl_id={crawl_id} />

            <div className="space-y-3 pl-3">
              {changes.map((change: EndpointChangeDoc) => (
                <FeedItem key={change._id} change={change} />
              ))}
            </div>
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

function FeedItem({ change }: { change: EndpointChangeDoc }) {
  const actionText =
    change.change_kind === 'create' ? (
      <span className="text-green-400">created</span>
    ) : change.change_kind === 'delete' ? (
      <span className="text-rose-400">removed</span>
    ) : (
      'updated: '
    )

  return (
    <div className="font-mono text-muted-foreground">
      <EntityBadgeInline slug={change.provider_tag_slug.split('/')[0]} /> endpoint for{' '}
      <EntityBadgeInline slug={change.model_slug} /> was {actionText}
      {change.change_kind === 'update' && (
        <>
          <Badge variant="outline" className="rounded-sm">
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
      .
    </div>
  )
}

function EntityBadgeInline({ slug }: { slug: string }) {
  return (
    <span className="text-foreground">
      <EntityAvatar className="mr-1 size-5 align-text-bottom" slug={slug} />
      {slug}
    </span>
  )
}
