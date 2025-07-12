'use client'

import { EndpointDataTable } from '@/components/endpoint-tables/endpoint-data-table'
import { PageContainer, PageHeader, PageLoading, PageTitle } from '@/components/page-container'
import { Card } from '@/components/ui/card'
import { useEndpoints, useModelsList } from '@/hooks/api'

export function ModelPage({ slug }: { slug: string }) {
  const models = useModelsList()
  const endpointsCollect = useEndpoints()

  const model = models?.find((m) => m.slug === slug)
  const endpoints = endpointsCollect?.filter((e) => e.model_slug === slug)

  if (!models || !endpointsCollect) {
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

      {/* Unified endpoint table with variant separators */}
      {endpoints && endpoints.length > 0 ? (
        <Card className="rounded-sm py-2">
          <EndpointDataTable model={model} endpoints={endpoints} />
        </Card>
      ) : (
        <div className="rounded-sm border p-8 text-center">
          <p className="text-sm text-muted-foreground">No endpoints available for this model.</p>
        </div>
      )}
    </PageContainer>
  )
}
