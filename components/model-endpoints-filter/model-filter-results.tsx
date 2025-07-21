'use client'

import { Button } from '../ui/button'
import { ModelFilterItem } from './results/model-filter-item'
import { type FilterResult } from './types'

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
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    )
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
    <div className="space-y-4">
      {results.map((result) => (
        <ModelFilterItem key={result.modelId} result={result} />
      ))}

      {/* Show More Button */}
      {hasMore && onShowMore && (
        <div className="pt-4 text-center">
          <Button variant="outline" onClick={onShowMore} size="lg">
            Show 20 more models
          </Button>
        </div>
      )}
    </div>
  )
}
