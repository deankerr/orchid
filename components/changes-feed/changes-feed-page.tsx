'use client'

import { useMemo } from 'react'

import { usePaginatedQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'
import type { FeedItem } from '@/convex/feed'

import { PageHeader, PageTitle } from '@/components/app-layout/pages'
import { Button } from '@/components/ui/button'

import { CrawlGroup } from './feed-groups'

export function ChangesFeedPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.feed.changes,
    {},
    { initialNumItems: 100 },
  )

  // Group feed items by crawl_id for timeline markers
  const crawlGroups = useMemo(() => {
    if (!results) return []

    const groups = new Map<string, FeedItem[]>()
    for (const item of results) {
      if (!groups.has(item.crawl_id)) {
        groups.set(item.crawl_id, [])
      }
      groups.get(item.crawl_id)!.push(item)
    }
    return Array.from(groups.entries())
  }, [results])

  if (status === 'LoadingFirstPage') {
    return (
      <>
        <PageHeader>
          <PageTitle>Changes Feed</PageTitle>
        </PageHeader>
        <div className="p-8 text-center text-muted-foreground">Loading changes...</div>
      </>
    )
  }

  if (!results || results.length === 0) {
    return (
      <>
        <PageHeader>
          <PageTitle>Changes Feed</PageTitle>
        </PageHeader>
        <div className="p-8 text-center text-muted-foreground">No changes found</div>
      </>
    )
  }

  return (
    <>
      <PageHeader>
        <PageTitle>Changes Feed</PageTitle>
      </PageHeader>

      <div className="space-y-8 px-4 pb-8">
        {crawlGroups.map(([crawl_id, items]) => (
          <CrawlGroup key={crawl_id} crawl_id={crawl_id} items={items} />
        ))}

        {status === 'CanLoadMore' && (
          <div className="flex justify-center">
            <Button onClick={() => loadMore(100)} variant="outline">
              Load More
            </Button>
          </div>
        )}

        {status === 'LoadingMore' && (
          <div className="p-4 text-center text-muted-foreground">Loading more changes...</div>
        )}
      </div>
    </>
  )
}
