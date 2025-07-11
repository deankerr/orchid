'use client'

import { EndpointCard } from '@/components/endpoint-card'
import { DataStreamLoader, EmptyState, ErrorState } from '@/components/loading'
import { ModelAppsLeaderboard } from '@/components/model-apps-leaderboard'
import { ModelCard } from '@/components/model-card'
import { ModelTokenChart } from '@/components/model-token-chart'
import {
  useEndpointsList,
  useModelAppsLeaderboards,
  useModelsList,
  useModelTokenMetrics,
} from '@/hooks/api'

import { EndpointSummary } from './endpoint-summary'
import { PageContainer } from './page-container'

interface ModelPageProps {
  slug: string
}

export function ModelPage({ slug }: ModelPageProps) {
  const models = useModelsList()
  const model = models?.find((m) => m.slug === slug)

  const endpointsList = useEndpointsList()
  const endpoints = endpointsList?.filter((e) => e.model_slug === slug)

  const leaderboardsMap = useModelAppsLeaderboards(model?.permaslug)

  const modelTokenMetrics = useModelTokenMetrics(model?.permaslug)

  if (!models) {
    if (models === null) {
      return (
        <PageContainer>
          <ErrorState message="Failed to load models" />
        </PageContainer>
      )
    }
    return (
      <PageContainer>
        <DataStreamLoader label="Loading models..." />
      </PageContainer>
    )
  }

  if (!model) {
    return (
      <PageContainer>
        <EmptyState message="Model not found" icon="404" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
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
        Object.entries(modelTokenMetrics).map(([variant, metrics]) => (
          <ModelTokenChart key={variant} data={metrics ?? []} variant={variant} />
        ))
      )}
    </PageContainer>
  )
}
