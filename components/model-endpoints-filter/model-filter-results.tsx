'use client'

import { PageLoading } from '../shared/page-container'
import { Button } from '../ui/button'
import { type FilterResult } from './filter'
import { ModelSummaryCard } from './model-summary-card'

interface ModelFilterResultsProps {
  results: FilterResult[]
  isLoading?: boolean
  hasMore?: boolean
  onShowMore?: () => void
}

export function ModelFilterResults({
  results,
  isLoading,
  hasMore = false,
  onShowMore,
}: ModelFilterResultsProps) {
  if (isLoading) {
    return <PageLoading />
  }

  if (results.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-2 text-lg font-medium text-muted-foreground">No models found</div>
        <div className="text-sm text-muted-foreground">
          Try adjusting your filters or search query
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-3">
      {results.map((result) => (
        <ModelSummaryCard key={result.modelId} result={result} />
      ))}

      {/* Show More Button */}
      {hasMore && onShowMore && (
        <div className="pt-4 text-center">
          <Button variant="outline" onClick={onShowMore} size="lg">
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
