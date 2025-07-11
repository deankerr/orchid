'use client'

import { EndpointsComparison } from '@/components/endpoint-tables'
import { PageContainer, PageHeader, PageLoading, PageTitle } from '@/components/page-container'
import { useEndpointsList, useModelsList } from '@/hooks/api'

export function ModelPage({ slug }: { slug: string }) {
  const models = useModelsList()
  const endpoints = useEndpointsList()

  const model = models?.find((m) => m.slug === slug)
  const modelEndpoints = endpoints?.filter((e) => e.model_slug === slug)

  if (!models || !endpoints) {
    return <PageLoading />
  }

  if (!model) {
    return (
      <PageContainer>
        <PageHeader>
          <PageTitle>Model not found</PageTitle>
        </PageHeader>
        <p className="text-muted-foreground">The model &ldquo;{slug}&rdquo; could not be found.</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>{model.name}</PageTitle>
      </PageHeader>

      {/* Model description */}
      {model.description && <p className="text-sm text-muted-foreground">{model.description}</p>}

      {/* Endpoint comparison table */}
      {modelEndpoints && modelEndpoints.length > 0 ? (
        <EndpointsComparison model={model} endpoints={modelEndpoints} />
      ) : (
        <div className="rounded-sm border p-8 text-center">
          <p className="text-sm text-muted-foreground">No endpoints available for this model.</p>
        </div>
      )}
    </PageContainer>
  )
}
