'use client'

import { usePaginatedQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'

import { ProviderBadge } from '@/components/shared/entity-badge'
import { PaginatedLoadButton } from '@/components/shared/paginated-load-button'
import { Badge } from '@/components/ui/badge'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { formatDateTime } from '@/lib/formatters'
import { groupBy } from '@/lib/grouping'

import { CreateChanges, DeleteChanges, UpdateChanges } from './feed-tree-changes'
import { FeedTreeContent, FeedTreeGroup, FeedTreeItem, FeedTreeTrigger } from './feed-tree-group'

const DEFAULT_EXPAND_ALL_GROUPS = true

export function FeedTree() {
  useCachedQuery(api.providers.list, {})
  useCachedQuery(api.models.list, {})
  const items = usePaginatedQuery(api.dev.feedTree.feedTreeItems, {}, { initialNumItems: 50 })

  const itemsByCrawlId = groupBy(items.results, (item) => item.crawl_id)

  return (
    <div className="mx-4 border p-4">
      <div className="space-y-6">
        {itemsByCrawlId.map(({ key: crawl_id, items: crawlItems }) => {
          const itemsByProvider = groupBy(crawlItems, (item) => item.provider_tag_slug)

          return (
            <FeedTreeGroup
              key={crawl_id}
              defaultValue={DEFAULT_EXPAND_ALL_GROUPS ? crawl_id : undefined}
            >
              <FeedTreeItem value={crawl_id}>
                <FeedTreeTrigger>
                  <Badge>
                    <time dateTime={new Date(Number(crawl_id)).toISOString()}>
                      {formatDateTime(Number(crawl_id))}
                    </time>
                  </Badge>
                </FeedTreeTrigger>
                <FeedTreeContent>
                  {itemsByProvider
                    .sort((a, b) => a.key.localeCompare(b.key))
                    .map(({ key: provider_tag_slug, items: providerItems }) => {
                      const itemsByModel = groupBy(providerItems, (item) => item.model_slug)
                      const providerValue = `${crawl_id}-${provider_tag_slug}`

                      return (
                        <FeedTreeGroup
                          key={provider_tag_slug}
                          defaultValue={DEFAULT_EXPAND_ALL_GROUPS ? providerValue : undefined}
                        >
                          <FeedTreeItem value={providerValue}>
                            <FeedTreeTrigger>
                              <ProviderBadge slug={provider_tag_slug} />
                            </FeedTreeTrigger>
                            <FeedTreeContent className="space-y-3 pt-3">
                              {itemsByModel
                                .sort((a, b) => a.key.localeCompare(b.key))
                                .map(({ key: model_slug, items: modelItems }) => {
                                  const itemsByChangeKind = groupBy(
                                    modelItems,
                                    (item) => item.change_kind,
                                  )

                                  return itemsByChangeKind.map(
                                    ({ key: change_kind, items: changeKindItems }) => {
                                      if (change_kind === 'create') {
                                        return (
                                          <CreateChanges
                                            key={`${model_slug}-creates`}
                                            items={changeKindItems}
                                          />
                                        )
                                      }

                                      if (change_kind === 'delete') {
                                        return (
                                          <DeleteChanges
                                            key={`${model_slug}-deletes`}
                                            items={changeKindItems}
                                          />
                                        )
                                      }

                                      if (change_kind === 'update') {
                                        return (
                                          <UpdateChanges
                                            key={`${model_slug}-updates`}
                                            items={changeKindItems}
                                            modelSlug={model_slug}
                                            defaultExpanded={DEFAULT_EXPAND_ALL_GROUPS}
                                          />
                                        )
                                      }
                                    },
                                  )
                                })}
                            </FeedTreeContent>
                          </FeedTreeItem>
                        </FeedTreeGroup>
                      )
                    })}
                </FeedTreeContent>
              </FeedTreeItem>
            </FeedTreeGroup>
          )
        })}
      </div>

      <div className="flex items-center justify-center">
        <PaginatedLoadButton status={items.status} onClick={() => items.loadMore(50)} />
      </div>
    </div>
  )
}
