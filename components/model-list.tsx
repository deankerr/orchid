import { memo } from 'react'

import { OrModel } from '@/convex/types'

import { ModelCard } from '@/components/model-card'

import { EmptyState } from './loading'

interface ModelListProps {
  models: OrModel[]
}

export const ModelList = memo(function ModelList({ models }: ModelListProps) {
  return (
    <div className="space-y-4">
      {models.map((model) => (
        <ModelCard key={model._id} model={model} />
      ))}

      {models.length === 0 && <EmptyState message="No models found" />}
    </div>
  )
})
