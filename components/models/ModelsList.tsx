'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import { usePaginatedQuery } from 'convex/react'
import { ModelCard } from './ModelCard'

export function ModelsList() {
  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.models.listModelsWithEndpoints,
    {},
    { initialNumItems: 30 },
  )

  return (
    <div className="container mx-auto">
      {isLoading && !results.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((model) => (
              <ModelCard key={model.modelKey} model={model} />
            ))}
          </div>

          {status !== 'Exhausted' && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => loadMore(12)} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Load More Models'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
