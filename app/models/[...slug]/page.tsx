'use client'

import { use } from 'react'

import { EndpointCard } from '@/components/endpoint-card'
import { ModelCard } from '@/components/model-card'
import { ModelTokenChart } from '@/components/model-token-chart'
import { ModelTopApps } from '@/components/model-top-apps'
import { PageContainer } from '@/components/page-container'
import {
  useOrEndpoints,
  useOrModel,
  useOrModelTokenMetrics,
  useOrTopAppsForModel,
} from '@/hooks/api'

export default function ModelPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const slug = use(params).slug.join('/')
  const model = useOrModel(slug)
  const endpoints = useOrEndpoints(slug)
  const apps = useOrTopAppsForModel(slug)

  const modelTokenMetrics = useOrModelTokenMetrics(slug)
  const tokenMetricsByVariant = Map.groupBy(modelTokenMetrics ?? [], (m) => m.model_variant)
  const appsByVariant = Map.groupBy(apps ?? [], (app) => app.metric.model_variant)

  if (!model) {
    if (model === null) {
      return (
        <PageContainer>
          <div className="font-mono">Model not found</div>
        </PageContainer>
      )
    } else {
      return (
        <PageContainer>
          <div className="font-mono">Loading...</div>
        </PageContainer>
      )
    }
  }

  return (
    <PageContainer>
      <ModelCard model={model} />
      {Array.from(appsByVariant.entries()).map(([variant, variantApps]) => (
        <ModelTopApps
          key={variant}
          apps={variantApps}
          title={variant === 'standard' ? 'Top Apps' : `Top Apps (${variant})`}
        />
      ))}
      {Array.from(tokenMetricsByVariant.entries()).map(([variant, metrics]) => (
        <ModelTokenChart key={variant} data={metrics} variant={variant} />
      ))}
      {endpoints?.map((endpoint) => <EndpointCard key={endpoint._id} endpoint={endpoint} />)}
    </PageContainer>
  )
}
