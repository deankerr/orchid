'use client'

import { useEffect, useState } from 'react'

import { usePaginatedQuery } from 'convex/react'

import { Loader2Icon } from 'lucide-react'

import { api } from '@/convex/_generated/api'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

import { PageDescription, PageHeader, PageTitle } from '../app-layout/pages'
import { DataGridFrame, DataGridFrameFooter, DataGridFrameToolbar } from '../data-grid-frame'
import { FeatureFlag } from '../dev-utils/feature-flag'
import { Checkbox } from '../ui/checkbox'
import { DataGridContainer } from '../ui/data-grid'
import { Label } from '../ui/label'
import { ChangesDataGrid } from './changes-data-grid'

const LOAD_MORE_THRESHOLD = 500
const ITEMS_PER_PAGE = 40
const INITIAL_NUM_ITEMS = 20

type EntityType = 'all' | 'model' | 'endpoint' | 'provider'
type ChangeAction = 'all' | 'create' | 'update' | 'delete'

export function ChangesDataGridPage() {
  const [entityType, setEntityType] = useState<EntityType>('all') // Show all changes to see record changes
  const [changeAction, setChangeAction] = useState<ChangeAction>('all')
  const [forceLoading, setForceLoading] = useState(false)

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.db.or.changes.list,
    {
      entity_type: entityType === 'all' ? undefined : entityType,
      change_action: changeAction === 'all' ? undefined : changeAction,
      include_hidden: false, // End-users always see only displayable changes
    },
    { initialNumItems: INITIAL_NUM_ITEMS },
  )

  const isInitialLoad = status === 'LoadingFirstPage'

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
        <PageTitle>Changes</PageTitle>
        <PageDescription>View changes detected between OpenRouter snapshots</PageDescription>
      </PageHeader>

      <DataGridFrame>
        <DataGridFrameToolbar>
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
        </DataGridFrameToolbar>

        <DataGridContainer
          ref={scrollRef}
          className="flex-1 items-start overflow-x-auto overscroll-none rounded-none border-x-0"
        >
          <ChangesDataGrid changes={results || []} isLoading={isInitialLoad || forceLoading} />
        </DataGridContainer>

        <DataGridFrameFooter>
          <div className="justify-self-start">
            <FeatureFlag flag="dev">
              <div className="ml-auto border border-dashed p-1 font-mono">
                <Label className="text-xs">
                  loading
                  <Checkbox
                    checked={forceLoading}
                    onCheckedChange={(checked) => setForceLoading(checked === true)}
                    title="Force loading state (debug)"
                  />
                </Label>
              </div>
            </FeatureFlag>
          </div>

          <div className="">{isLoading && <Spinner />}</div>

          <div className="justify-self-end font-mono text-xs">
            {results?.length || 0} items loaded
          </div>
        </DataGridFrameFooter>
      </DataGridFrame>
    </>
  )
}

function Spinner() {
  return <Loader2Icon className="animate-spin" />
}
