'use client'

import { EndpointCard } from '@/components/endpoint-card'
import { ModelCard } from '@/components/model-card'
import { ModelTokenChart } from '@/components/model-token-chart'
import { ModelTopApps } from '@/components/model-top-apps'
import {
  useOrEndpoints,
  useOrModel,
  useOrModelTokenMetrics,
  useOrTopAppsForModel,
} from '@/hooks/api'

interface ModelPageProps {
  slug: string
}

export function ModelPage({ slug }: ModelPageProps) {
  const model = useOrModel(slug)
  const endpoints = useOrEndpoints(slug)
  const apps = useOrTopAppsForModel(slug)

  const modelTokenMetrics = useOrModelTokenMetrics(slug)
  const tokenMetricsByVariant = Map.groupBy(modelTokenMetrics ?? [], (m) => m.model_variant)
  const appsByVariant = Map.groupBy(apps ?? [], (app) => app.metric.model_variant)

  if (!model) {
    if (model === null) {
      return <div className="font-mono">Model not found</div>
    } else {
      return <div className="font-mono">Loading...</div>
    }
  }

  return (
    <>
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
    </>
  )
}
