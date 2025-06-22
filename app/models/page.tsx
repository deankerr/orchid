'use client'

import { ModelCard } from '@/components/model-card'
import { PageContainer } from '@/components/page-container'
import { useOrModels } from '@/hooks/api'

export default function ModelsPage() {
  const models = useOrModels()

  return (
    <PageContainer>
      {models?.map((model) => <ModelCard key={model._id} model={model} />)}
    </PageContainer>
  )
}
