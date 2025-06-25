'use client'

import { EndpointCard } from '@/components/endpoint-card'
import { DataStreamLoader, EmptyState } from '@/components/loading'
import { ModelCard } from '@/components/model-card'
import { ModelTokenChart } from '@/components/model-token-chart'
import { ModelTopApps } from '@/components/model-top-apps'
import {
  useOrEndpoints,
  useOrModel,
  useOrModelTokenMetrics,
  useOrTopAppsForModel,
} from '@/hooks/api'

import { EndpointSummary } from './endpoint-summary'

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
      return <EmptyState message="Model not found" icon="404" />
    } else {
      return <DataStreamLoader label="Loading model data" />
    }
  }

  return (
    <div className="space-y-6">
      <ModelCard model={model} />

      {/* Endpoints Section */}
      <div className="space-y-4">
        {endpoints === undefined ? (
          <DataStreamLoader label="Loading endpoints..." />
        ) : endpoints.length > 0 ? (
          <>
            <EndpointSummary model={model} endpoints={endpoints} />
            {endpoints.map((endpoint) => (
              <EndpointCard key={endpoint._id} endpoint={endpoint} />
            ))}
          </>
        ) : (
          <EmptyState message="No endpoints available" icon="⚡" />
        )}
      </div>

      {/* Apps Section */}
      {apps === undefined ? (
        <DataStreamLoader label="Loading applications..." />
      ) : (
        Array.from(appsByVariant.entries()).map(([variant, variantApps]) => (
          <ModelTopApps
            key={variant}
            apps={variantApps}
            title={variant === 'standard' ? 'Top Apps' : `Top Apps (${variant})`}
          />
        ))
      )}

      {/* Token Metrics Section */}
      {modelTokenMetrics === undefined ? (
        <DataStreamLoader label="Loading metrics..." />
      ) : (
        Array.from(tokenMetricsByVariant.entries()).map(([variant, metrics]) => (
          <ModelTokenChart key={variant} data={metrics} variant={variant} />
        ))
      )}
    </div>
  )
}
