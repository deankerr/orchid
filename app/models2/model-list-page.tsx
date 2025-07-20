'use client'

import { ModelEndpointsFilterWithData } from '@/components/model-endpoints-filter'
import { PageContainer, PageHeader, PageTitle } from '@/components/page-container'

export function ModelListPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>AI Models</PageTitle>
        <p className="text-muted-foreground">
          Discover and compare AI models available through OpenRouter
        </p>
      </PageHeader>

      <ModelEndpointsFilterWithData />
    </PageContainer>
  )
}
