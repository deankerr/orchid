'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useQueryStates } from 'nuqs'

import { useEndpointsList, useModelsList } from '@/hooks/api'

import { filterParsers, ModelFilterControls } from './ModelFilterControls'
import { ModelFilterResults } from './ModelFilterResults'
import { filterModels, urlStateToFilterState } from './utils'

export function ModelEndpointsFilterWithData() {
  const [displayCount, setDisplayCount] = useState(20)

  // Get data from API
  const models = useModelsList()
  const endpoints = useEndpointsList()

  // Get filter state from URL
  const [urlState] = useQueryStates(filterParsers, {
    history: 'replace',
    shallow: true,
  })

  // Convert URL state to filter state
  const filters = useMemo(() => urlStateToFilterState(urlState), [urlState])

  // Apply filtering logic
  const { filteredResults, totalCount } = useMemo(() => {
    if (!models || !endpoints) {
      return { filteredResults: [], totalCount: 0 }
    }

    const results = filterModels(models, endpoints, filters, filters.sort, filters.direction)

    return {
      filteredResults: results,
      totalCount: models.length,
    }
  }, [models, endpoints, filters])

  // Display logic with pagination
  const displayedResults = useMemo(
    () => filteredResults.slice(0, displayCount),
    [filteredResults, displayCount],
  )

  const hasMore = filteredResults.length > displayCount

  const handleShowMore = useCallback(() => {
    setDisplayCount((prev) => prev + 20)
  }, [])

  // Reset display count when filters change
  const resetDisplayCount = useCallback(() => {
    setDisplayCount(20)
  }, [])

  // Reset display count when filters change
  useEffect(() => {
    resetDisplayCount()
  }, [filters, resetDisplayCount])

  const isLoading = !models || !endpoints

  return (
    <div className="space-y-6">
      <ModelFilterControls resultCount={filteredResults.length} totalCount={totalCount} />
      <ModelFilterResults
        results={displayedResults}
        isLoading={isLoading}
        hasMore={hasMore}
        onShowMore={handleShowMore}
      />
    </div>
  )
}
