'use client'

import { useEffect, useState } from 'react'

import { usePaginatedQuery } from 'convex/react'

import { Loader2Icon } from 'lucide-react'

import { api } from '@/convex/_generated/api'

import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

import { PageDescription, PageHeader, PageTitle } from '../app-layout/pages'
import { Button } from '../ui/button'
import { DataGridContainer } from '../ui/data-grid'
import { EndpointsDataGrid } from './endpoints-data-grid'
import { OREntityCombobox } from './or-entity-combobox'

const LOAD_MORE_THRESHOLD = 500
const ITEMS_PER_PAGE = 40
const INITIAL_NUM_ITEMS = 40

export function EndpointsDataGridPage() {
  const [selectedEntity, setSelectedEntity] = useState('')

  const { results, status, loadMore } = usePaginatedQuery(
    api.db.or.views.endpoints.list,
    {
      modelSlug: selectedEntity && selectedEntity.includes('/') ? selectedEntity : undefined,
      providerSlug: selectedEntity && !selectedEntity.includes('/') ? selectedEntity : undefined,
    },

    { initialNumItems: INITIAL_NUM_ITEMS },
  )

  const isInitialLoad = status === 'LoadingFirstPage'
  const isLoadingMore = status === 'LoadingMore'

  // Set up infinite scrolling
  const scrollRef = useInfiniteScroll(() => loadMore(ITEMS_PER_PAGE), {
    threshold: LOAD_MORE_THRESHOLD,
    hasMore: status === 'CanLoadMore',
    isLoading: status === 'LoadingMore',
  })

  // Reset data grid scroll position on initial load
  useEffect(() => {
    if (scrollRef.current && status === 'LoadingFirstPage') {
      scrollRef.current.scrollTop = 0
    }
  }, [status, scrollRef])

  return (
    <>
      <PageHeader>
        <PageTitle>Endpoints</PageTitle>
        <PageDescription>Browse models and providers available on OpenRouter</PageDescription>
      </PageHeader>

      <div className="mb-1 flex items-center gap-2 p-2">
        <OREntityCombobox value={selectedEntity} onValueChange={setSelectedEntity} />
        <Button variant="outline" disabled={!selectedEntity} onClick={() => setSelectedEntity('')}>
          Clear
        </Button>
      </div>

      <DataGridContainer
        ref={scrollRef}
        className="mb-2 w-[99%] flex-1 self-center overflow-x-auto rounded-none"
      >
        <EndpointsDataGrid endpoints={results || []} isLoading={isInitialLoad} />

        {!isInitialLoad && results.length > 0 && (
          <div className="grid h-14 place-content-center font-mono text-sm text-muted-foreground">
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
