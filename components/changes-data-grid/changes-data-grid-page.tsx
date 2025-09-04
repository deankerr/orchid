'use client'

import { useEffect, useState } from 'react'

import { usePaginatedQuery } from 'convex/react'

import { Loader2Icon } from 'lucide-react'

import { api } from '@/convex/_generated/api'

import { ChangesDataGrid } from '@/components/changes-data-grid/changes-data-grid'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useModelsList, useProvidersList } from '@/hooks/api'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

import { PageDescription, PageHeader, PageTitle } from '../app-layout/pages'
import { DataGridContainer } from '../ui/data-grid'

const LOAD_MORE_THRESHOLD = 500
const ITEMS_PER_PAGE = 40
const INITIAL_NUM_ITEMS = 20

type EntityType = 'all' | 'model' | 'endpoint' | 'provider'
type ChangeAction = 'all' | 'create' | 'update' | 'delete'

export function ChangesDataGridPage() {
  const [entityType, setEntityType] = useState<EntityType>('all') // Show all changes to see record changes
  const [changeAction, setChangeAction] = useState<ChangeAction>('all')

  const { results, status, loadMore } = usePaginatedQuery(
    api.views.changes.list,
    {
      entity_type: entityType === 'all' ? undefined : entityType,
      change_action: changeAction === 'all' ? undefined : changeAction,
      include_hidden: false, // End-users always see only displayable changes
    },
    { initialNumItems: INITIAL_NUM_ITEMS },
  )

  const models = useModelsList()
  const providers = useProvidersList()
  const isInitialLoad = status === 'LoadingFirstPage' || !models || !providers
  const isLoadingMore = status === 'LoadingMore'
  const canLoadMore = status === 'CanLoadMore'

  // Set up infinite scrolling with 400px threshold from bottom
  const scrollRef = useInfiniteScroll(() => loadMore(ITEMS_PER_PAGE), {
    threshold: LOAD_MORE_THRESHOLD,
    hasMore: canLoadMore,
    isLoading: isLoadingMore,
  })

  // Reset scroll position when filters change or on initial load
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [entityType, changeAction, isInitialLoad, scrollRef])

  return (
    <>
      <PageHeader>
        <PageTitle>Changes</PageTitle>
        <PageDescription>View changes detected between OpenRouter snapshots</PageDescription>
      </PageHeader>

      <div className="flex gap-2 px-2 py-3">
        <Select value={entityType} onValueChange={(value) => setEntityType(value as EntityType)}>
          <SelectTrigger className="w-48" aria-label="Filter by entity type">
            <span className="sr-only">Filter by Type</span>
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="model">Models</SelectItem>
            <SelectItem value="endpoint">Endpoints</SelectItem>
            <SelectItem value="provider">Providers</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={changeAction}
          onValueChange={(value) => setChangeAction(value as ChangeAction)}
        >
          <SelectTrigger className="w-48" aria-label="Filter by change action">
            <span className="sr-only">Filter by Action</span>
            <SelectValue placeholder="Filter by Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataGridContainer
        ref={scrollRef}
        className="mb-2 w-[99%] flex-1 self-center overflow-x-auto rounded-none"
      >
        <ChangesDataGrid changes={results || []} isLoading={isInitialLoad} />

        {!isInitialLoad && (
          <div className="grid h-14 place-content-center border-t font-mono text-sm text-muted-foreground">
            {isLoadingMore && <Spinner />}
            {status === 'Exhausted' && 'No more changes found.'}
          </div>
        )}
      </DataGridContainer>
    </>
  )
}

function Spinner() {
  return <Loader2Icon className="animate-spin" />
}
