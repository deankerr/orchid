'use client'

import { EndpointCard } from '@/components/endpoint-card'
import { DataStreamLoader, EmptyState } from '@/components/loading'
import { ModelAppsLeaderboard } from '@/components/model-apps-leaderboard'
import { ModelCard } from '@/components/model-card'
import { ModelTokenChart } from '@/components/model-token-chart'
import {
  useModelAppsLeaderboards,
  useOrEndpoints,
  useOrModels,
  useOrModelTokenMetrics,
} from '@/hooks/api'

import { EndpointSummary } from './endpoint-summary'

interface ModelPageProps {
  slug: string
}

export function ModelPage({ slug }: ModelPageProps) {
  const models = useOrModels()
  const model = models?.find((m) => m.slug === slug)

  const endpoints = useOrEndpoints(slug)

  const leaderboardsMap = useModelAppsLeaderboards(model?.permaslug)

  const modelTokenMetrics = useOrModelTokenMetrics(slug)
  const tokenMetricsByVariant = Map.groupBy(modelTokenMetrics ?? [], (m) => m.model_variant)

  if (!models) {
    return <DataStreamLoader label="Loading models..." />
  }

  if (!model) {
    return <EmptyState message="Model not found" icon="404" />
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
      {leaderboardsMap === undefined ? (
        <DataStreamLoader label="Loading applications..." />
      ) : (
        [...leaderboardsMap.values()].map((leaderboard) => (
          <ModelAppsLeaderboard key={leaderboard._id} leaderboard={leaderboard} />
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
