'use client'

import { useState } from 'react'

import { useQuery } from 'convex-helpers/react/cache/hooks'

import { api } from '@/convex/_generated/api'

import { Button } from '@/components/ui/button'
import { ThemeButton } from '@/components/ui/theme-button'

import { Model } from './model'

function useModelsAndEndpoints() {
  const models = useQuery(api.frontend.listOrModels)
  const endpoints = useQuery(api.dev.listEndpoints)

  if (models === null || endpoints === null) return null
  if (!(models && endpoints)) return

  const modelWithEndpoints = endpoints.map((group) => ({
    ...group,
    model: models.find((m) => m.slug === group.model_slug)!,
  }))

  return { models, endpoints, modelWithEndpoints }
}

const sortByKeys = ['original', 'tokens', 'requests', 'alphabetical'] as const
type SortBy = (typeof sortByKeys)[number]

export type ModelWithEndpoint = NonNullable<
  ReturnType<typeof useModelsAndEndpoints>
>['modelWithEndpoints'][number]

export default function Page() {
  const data = useModelsAndEndpoints()
  const [sortBy, setSortBy] = useState<SortBy>('original')

  if (!data) return <div>Loading</div>

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl">Models ({data.modelWithEndpoints.length})</h1>

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
        <ThemeButton />
      </div>

      <div className="space-y-4">
        {data.modelWithEndpoints
          .sort((a, b) => {
            if (sortBy === 'original') return 0
            if (sortBy === 'tokens') return b.metrics.tokens - a.metrics.tokens
            if (sortBy === 'requests') return b.metrics.requests - a.metrics.requests
            return a.model.name.localeCompare(b.model.name)
          })
          .map((m) => (
            <Model key={m.variantSlug} model={m} />
          ))}
      </div>
    </div>
  )
}
