'use client'

import { useState } from 'react'

import { usePaginatedQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'
import { EndpointChangeDoc } from '@/convex/feed'

import { PageHeader, PageTitle } from '@/components/app-layout/pages'
import { FeedList, FeedTimeline } from '@/components/changes-feed/feed-groups'
import {
  FeedItem,
  FeedItemContent,
  FeedItemPath,
  FeedItemSentence,
} from '@/components/changes-feed/feed-item'
import { InlineValueChange } from '@/components/changes-feed/feed-values'
import { ModelBadge, ProviderBadge } from '@/components/shared/entity-badge'
import { PaginatedLoadButton } from '@/components/shared/paginated-load-button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { groupBy } from '@/lib/grouping'
import { cn } from '@/lib/utils'

export default function Page() {
  const [groupByProvider, setGroupByProvider] = useState(true)
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
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex items-center gap-2">
            <Checkbox
              id="group-by-provider"
              checked={groupByProvider}
              onCheckedChange={(checked) => setGroupByProvider(checked === true)}
            />
            <Label htmlFor="group-by-provider" className="cursor-pointer">
              By Provider
            </Label>
          </div>

          {results.map(({ crawl_id, data: changes }) => (
            <div key={crawl_id} className={cn('max-w-4xl space-y-4')}>
              <FeedTimeline crawl_id={crawl_id} count={changes.length} />
              {groupByProvider ? (
                <div className="space-y-4">
                  {groupBy(changes, (change) => change.provider_tag_slug).map(
                    ({ key: provider_tag_slug, items }) => (
                      <div key={provider_tag_slug} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <ProviderBadge slug={provider_tag_slug} />
                          <div className="h-px flex-1 bg-border/30" />
                        </div>

                        <FeedList>
                          {items.map((change: EndpointChangeDoc) => (
                            <ChangeFeedItem key={change._id} change={change} showProvider={false} />
                          ))}
                        </FeedList>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <FeedList>
                  {changes.map((change: EndpointChangeDoc) => (
                    <ChangeFeedItem key={change._id} change={change} showProvider={true} />
                  ))}
                </FeedList>
              )}
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

function ChangeFeedItem({
  change,
  showProvider,
}: {
  change: EndpointChangeDoc
  showProvider: boolean
}) {
  const actionText =
    change.change_kind === 'create' ? (
      <span className="text-green-400">created</span>
    ) : change.change_kind === 'delete' ? (
      <span className="text-rose-400">deleted</span>
    ) : (
      'changed:'
    )

  return (
    <FeedItem className="py-1.5 text-xs">
      <FeedItemContent>
        <FeedItemSentence>
          {showProvider && <ProviderBadge slug={change.provider_tag_slug} inline />}
          endpoint for <ModelBadge slug={change.model_slug} inline />
          {actionText}
          {change.change_kind === 'update' && (
            <>
              <FeedItemPath path={change.path ?? ''} />
              <InlineValueChange
                before={change.before}
                after={change.after}
                path_level_1={change.path_level_1}
                path_level_2={change.path_level_2}
              />
            </>
          )}
        </FeedItemSentence>
      </FeedItemContent>
    </FeedItem>
  )
}
