'use client'

import { useEffect, useState } from 'react'

import { usePaginatedQuery } from 'convex/react'

import { Loader2Icon } from 'lucide-react'

import { api } from '@/convex/_generated/api'

import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

import { PageDescription, PageHeader, PageTitle } from '../app-layout/pages'
import { DataGridFrame, DataGridFrameFooter, DataGridFrameToolbar } from '../data-grid-frame'
import { FeatureFlag } from '../dev-utils/feature-flag'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { DataGridContainer } from '../ui/data-grid'
import { Label } from '../ui/label'
import { EndpointsDataGrid } from './endpoints-data-grid'
import { OREntityCombobox } from './or-entity-combobox'

const LOAD_MORE_THRESHOLD = 500
const ITEMS_PER_PAGE = 40
const INITIAL_NUM_ITEMS = 20

export function EndpointsDataGridPage() {
  const [selectedEntity, setSelectedEntity] = useState('')
  const [forceLoading, setForceLoading] = useState(false)

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.db.or.views.endpoints.list,
    {
      modelSlug: selectedEntity && selectedEntity.includes('/') ? selectedEntity : undefined,
      providerSlug: selectedEntity && !selectedEntity.includes('/') ? selectedEntity : undefined,
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
        <PageTitle>Endpoints</PageTitle>
        <PageDescription>Browse models and providers available on OpenRouter</PageDescription>
      </PageHeader>

      <DataGridFrame>
        <DataGridFrameToolbar>
          <OREntityCombobox value={selectedEntity} onValueChange={setSelectedEntity} />
          <Button
            variant="outline"
            disabled={!selectedEntity}
            onClick={() => setSelectedEntity('')}
          >
            Clear
          </Button>
        </DataGridFrameToolbar>

        <DataGridContainer
          ref={scrollRef}
          className="flex-1 items-start overflow-x-auto overscroll-none rounded-none border-x-0"
        >
          <EndpointsDataGrid endpoints={results || []} isLoading={isInitialLoad || forceLoading} />
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

          <div className="justify-self-end font-mono text-xs">{results.length} items loaded</div>
        </DataGridFrameFooter>
      </DataGridFrame>
    </>
  )
}

function Spinner() {
  return <Loader2Icon className="animate-spin" />
}
