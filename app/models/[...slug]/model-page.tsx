'use client'

import { PageContainer, PageHeader, PageLoading, PageTitle } from '@/components/page-container'
import { useModelsList } from '@/hooks/api'

// this is a new model page. we are reimplenting it here.
export function ModelPage({ slug }: { slug: string }) {
  const models = useModelsList()
  const model = models?.find((m) => m.slug === slug)

  if (!model) {
    return <PageLoading />
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>{model.name}</PageTitle>
      </PageHeader>
    </PageContainer>
  )
}
