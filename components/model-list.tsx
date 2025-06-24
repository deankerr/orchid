import { memo } from 'react'

import { OrModel } from '@/convex/types'

import { ModelCard } from '@/components/model-card'

interface ModelListProps {
  models: OrModel[]
}

export const ModelList = memo(function ModelList({ models }: ModelListProps) {
  return (
    <>
      {models.map((model) => (
        <ModelCard key={model._id} model={model} />
      ))}
    </>
  )
})
