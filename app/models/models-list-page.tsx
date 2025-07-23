'use client'

import { ModelEndpointsFilter } from '@/components/model-endpoints-filter/model-endpoints-filter'
import { PageContainer, PageHeader, PageTitle } from '@/components/shared/page-container'

export function ModelListPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Models</PageTitle>
        <p className="text-muted-foreground">
          Discover and compare LLMs available through OpenRouter
        </p>
      </PageHeader>

      <ModelEndpointsFilter />
    </PageContainer>
  )
}
