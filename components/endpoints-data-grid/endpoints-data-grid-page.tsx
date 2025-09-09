'use client'

import { useEffect } from 'react'

import { usePaginatedQuery } from 'convex/react'

import { Loader2Icon } from 'lucide-react'

import { api } from '@/convex/_generated/api'

import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

import { PageDescription, PageHeader, PageTitle } from '../app-layout/pages'
import { DataGridContainer } from '../ui/data-grid'
import { EndpointsDataGrid } from './endpoints-data-grid'

const LOAD_MORE_THRESHOLD = 500
const ITEMS_PER_PAGE = 40
const INITIAL_NUM_ITEMS = 20

export function EndpointsDataGridPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.db.or.views.endpoints.paginate,
    {},
    { initialNumItems: INITIAL_NUM_ITEMS },
  )

  const isInitialLoad = status === 'LoadingFirstPage'
  const isLoadingMore = status === 'LoadingMore'
  const canLoadMore = status === 'CanLoadMore'

  // Set up infinite scrolling
  const scrollRef = useInfiniteScroll(() => loadMore(ITEMS_PER_PAGE), {
    threshold: LOAD_MORE_THRESHOLD,
    hasMore: canLoadMore,
    isLoading: isLoadingMore,
  })

  // Reset scroll position on initial load
  useEffect(() => {
    if (scrollRef.current && isInitialLoad) {
      scrollRef.current.scrollTop = 0
    }
  }, [isInitialLoad, scrollRef])

  return (
    <>
      <PageHeader>
        <PageTitle>Endpoints</PageTitle>
        <PageDescription>Browse all model endpoints from OpenRouter</PageDescription>
      </PageHeader>

      <DataGridContainer
        ref={scrollRef}
        className="mb-2 w-[99%] flex-1 self-center overflow-x-auto rounded-none"
      >
        <EndpointsDataGrid endpoints={results || []} isLoading={isInitialLoad} />

        {!isInitialLoad && results.length > 0 && (
          <div className="grid h-14 place-content-center border-t font-mono text-sm text-muted-foreground">
            {isLoadingMore && <Spinner />}
            {status === 'Exhausted' && 'No more endpoints found.'}
          </div>
        )}
      </DataGridContainer>
    </>
  )
}

function Spinner() {
  return <Loader2Icon className="animate-spin" />
}
