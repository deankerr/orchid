'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useEndpointsList, useModelsList } from '@/hooks/api'

import { filterModels } from './filter'
import { ModelFilterControls } from './model-filter-controls'
import { ModelFilterResults } from './model-filter-results'
import { useModelFilterSearchParams } from './search-params'

export function ModelEndpointsFilter() {
  const [displayCount, setDisplayCount] = useState(20)

  // Get data from API
  const models = useModelsList()
  const endpoints = useEndpointsList()

  // Get filter state from URL
  const [filters] = useModelFilterSearchParams()

  // Apply filtering logic
  const { filteredResults } = useMemo(() => {
    if (!models || !endpoints) {
      return { filteredResults: [], totalCount: 0 }
    }

    const results = filterModels(models, endpoints, filters)

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
      <ModelFilterControls />
      <ModelFilterResults
        results={displayedResults}
        isLoading={isLoading}
        hasMore={hasMore}
        onShowMore={handleShowMore}
      />
    </div>
  )
}
