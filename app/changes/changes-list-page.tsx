'use client'

import { usePaginatedQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'

import { EndpointsChangesGrid } from '@/components/endpoints-changes/endpoint-changes-grid'
import { PageContainer, PageHeader, PageTitle } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'

const ITEMS_PER_PAGE = 50

export function ChangesListPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.views.endpoints.listChanges,
    {},
    { initialNumItems: ITEMS_PER_PAGE },
  )

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Changes</PageTitle>
        <p className="text-muted-foreground">View changes detected between OpenRouter snapshots</p>
      </PageHeader>

      <EndpointsChangesGrid changes={results} />

      {status === 'CanLoadMore' && (
        <Button onClick={() => loadMore(ITEMS_PER_PAGE)} variant="outline" className="w-full">
          Load More
        </Button>
      )}

      {status === 'LoadingMore' && (
        <div className="p-4 text-center text-muted-foreground">Loading more changes...</div>
      )}
    </PageContainer>
  )
}
