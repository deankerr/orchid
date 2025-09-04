'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { PageDescription, PageHeader, PageTitle } from '@/components/app-layout/pages'
import { filterModels } from '@/components/model-endpoints-filter/filter'
import { ModelFilterControls } from '@/components/model-endpoints-filter/model-filter-controls'
import { ModelFilterResults } from '@/components/model-endpoints-filter/model-filter-results'
import { useModelFilterSearchParams } from '@/components/model-endpoints-filter/search-params'
import { useEndpointsList, useModelsList } from '@/hooks/api'

export function ModelListPage() {
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
    <>
      <PageHeader>
        <PageTitle>Models</PageTitle>
        <PageDescription>Browse models available on OpenRouter</PageDescription>
      </PageHeader>

      <ModelFilterControls />

      <ModelFilterResults
        results={displayedResults}
        isLoading={isLoading}
        hasMore={hasMore}
        onShowMore={handleShowMore}
      />
    </>
  )
}
