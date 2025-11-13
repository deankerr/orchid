'use client'

import Image from 'next/image'

import { usePaginatedQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'
import { EndpointChangeDoc } from '@/convex/feed'

import { PageHeader, PageTitle } from '@/components/app-layout/pages'
import { FeedTimelineMarker } from '@/components/changes-feed/feed-groups'
import { InlineValueChange } from '@/components/changes-feed/feed-values'
import { PaginatedLoadButton } from '@/components/shared/paginated-load-button'
import { Badge } from '@/components/ui/badge'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { getLogo } from '@/lib/logos'

export function ChangesFeedPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.feed.changesByCrawlId,
    {},
    { initialNumItems: 50 },
  )

  // preload badge data
  useCachedQuery(api.db.or.views.providers.list, {})
  useCachedQuery(api.db.or.views.models.list, {})

  return (
    <>
      <PageHeader>
        <PageTitle>Endpoint Changes Feed (preview)</PageTitle>
      </PageHeader>

      <div className="px-4 py-6">
        <div className="space-y-8">
          {results.map(({ crawl_id, data: changes }) => (
            <div key={crawl_id} className="space-y-4 text-sm">
              <FeedTimelineMarker crawl_id={crawl_id} />

              <div className="space-y-3 pl-3">
                {changes.map((change: EndpointChangeDoc) => (
                  <ChangeFeedItem key={change._id} change={change} />
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-center py-4">
            <PaginatedLoadButton status={status} onClick={() => loadMore(1)} />
          </div>
        </div>
      </div>
    </>
  )
}

function ChangeFeedItem({ change }: { change: EndpointChangeDoc }) {
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
          <InlineValueChange
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

function EntityAvatarInline({ slug }: { slug: string }) {
  const { url, style } = getLogo(slug)
  return (
    <span
      className="mr-1 inline-flex size-5 items-center justify-center overflow-hidden rounded-sm border border-neutral-700 bg-muted align-text-bottom select-none"
      style={{ background: style?.background }}
    >
      {url ? (
        <Image src={url} alt="" width={18} height={18} style={{ scale: style?.scale ?? 0.75 }} />
      ) : (
        <span className="font-mono text-[80%] text-muted-foreground">
          {slug.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)}
        </span>
      )}
    </span>
  )
}

function EntityBadgeInline({ slug }: { slug: string }) {
  return (
    <span className="text-foreground">
      <EntityAvatarInline slug={slug} />
      {slug}
    </span>
  )
}
