'use client'

import { useDeferredValue, useMemo, useState } from 'react'

import fuzzysort from 'fuzzysort'

import { DataStreamLoader, ErrorState } from '@/components/loading'
import { PageContainer, PageTitle } from '@/components/page-container'
import { SearchInput } from '@/components/search-input'
import { Button } from '@/components/ui/button'
import { useModelsAndEndpoints } from '@/hooks/api'

import { Model } from './model'

const sortByKeys = ['created', 'tokens', 'alphabetical'] as const
export type SortBy = (typeof sortByKeys)[number]

export type ModelWithEndpoint = NonNullable<
  ReturnType<typeof useModelsAndEndpoints>
>['modelWithEndpoints'][number]

export function ModelsPage() {
  const data = useModelsAndEndpoints()
  const [sortBy, setSortBy] = useState<SortBy>('created')
  const [search, setSearch] = useState('')

  const processedData = useMemo(() => {
    if (!data) return []

    const filteredModels = fuzzysort
      .go(search, data.modelWithEndpoints, { key: 'model.name', all: true })
      .map((result) => ({ ...result.obj, score: result.score }))

    // If there's a search query, sort primarily by fuzzysort score bands, then by sortBy
    if (search) {
      return filteredModels.sort((a, b) => {
        const aTruncatedScore = Math.floor(a.score * 10) / 10
        const bTruncatedScore = Math.floor(b.score * 10) / 10

        // Sort by truncated fuzzysort score in descending order (higher score is better)
        if (aTruncatedScore !== bTruncatedScore) {
          return bTruncatedScore - aTruncatedScore
        }

        // If truncated scores are the same, apply the secondary sort based on sortBy
        if (sortBy === 'created') return b.model.or_created_at - a.model.or_created_at
        if (sortBy === 'tokens') return b.tokens_7d - a.tokens_7d
        return a.model.name.localeCompare(b.model.name)
      })
    } else {
      // If no search query, sort only by sortBy
      return filteredModels.sort((a, b) => {
        if (sortBy === 'created') return b.model.or_created_at - a.model.or_created_at
        if (sortBy === 'tokens') return b.tokens_7d - a.tokens_7d
        return a.model.name.localeCompare(b.model.name)
      })
    }
  }, [data, search, sortBy])

  const deferredData = useDeferredValue(processedData)

  if (!data) {
    if (data === null) {
      return (
        <PageContainer>
          <ErrorState message="Failed to load models" />
        </PageContainer>
      )
    }
    return (
      <PageContainer>
        <DataStreamLoader label="Loading models..." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <PageTitle>Models</PageTitle>

        <div className="grow" />
        <SearchInput value={search} onChange={setSearch} placeholder="Search models" />

        <div className="flex items-center gap-2">
          {sortByKeys.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => setSortBy(key)}
              disabled={sortBy === key}
            >
              {key}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Comparing {data.models.length} models with {data.endpoints.length} endpoints
      </p>

      <div className="space-y-4">
        {deferredData
          .filter((m) => m.variant === 'free')
          .map((m) => (
            <Model key={m.variantSlug} model={m} />
          ))}
      </div>
    </PageContainer>
  )
}
