import * as R from 'remeda'

import { api } from '@/convex/_generated/api'

import { useCachedQuery } from './use-cached-query'

export type EndpointsByVariant = NonNullable<ReturnType<typeof useEndpointsByVariant>>
export function useEndpointsByVariant() {
  const models = useModelsList()
  const endpoints = useEndpointsList()

  if (models === null || endpoints === null) return null
  if (!(models && endpoints)) return

  const endpointsByVariant = Object.entries(
    R.groupBy(endpoints, (endp) => endp.model_variant_slug),
  ).map(([model_variant_slug, endpoints]) => {
    const [model_slug, model_variant] = model_variant_slug.split(':')
    const model = models.find((m) => m.slug === model_slug)!

    return {
      model_variant_slug,
      model,
      model_variant,
      tokens_7d: model.stats?.[model_variant]?.tokens_7d ?? 0,
      endpoints,
    }
  })

  return endpointsByVariant
}

export function useModelsList() {
  return useCachedQuery(api.openrouter.entities.models.list, {}, 'useModelsList')
}

export type Endpoint = NonNullable<ReturnType<typeof useEndpointsList>>[number]
export function useEndpointsList() {
  return useCachedQuery(api.openrouter.entities.endpoints.list, {}, 'useEndpointsList')
}

export function useEndpointUptimes(endpoint_uuid: string) {
  return useCachedQuery(
    api.openrouter.entities.endpointUptimes.getLatest,
    { endpoint_uuid },
    `useEndpointUptimes (${endpoint_uuid})`,
  )
}

export function useModelAppsLeaderboards(permaslug?: string) {
  const result = useCachedQuery(
    api.openrouter.entities.modelAppLeaderboards.get,
    permaslug ? { permaslug } : 'skip',
    `useModelAppsLeaderboard (${permaslug})`,
  )

  return result ? new Map(result) : undefined
}

export function useModelTokenMetrics(permaslug?: string) {
  return useCachedQuery(
    api.openrouter.entities.modelTokenMetrics.getLatest,
    permaslug ? { permaslug } : 'skip',
    `useModelTokenMetrics (${permaslug})`,
  )
}

export function useProvidersList() {
  return useCachedQuery(api.openrouter.entities.providers.list, {})
}

export function useSnapshotStatus() {
  return useCachedQuery(api.openrouter.snapshot.getSnapshotStatus, {}, 'useSnapshotStatus')
}

export function useSnapshotRuns(limit?: number) {
  return useCachedQuery(api.openrouter.snapshot.getSnapshotRuns, { limit }, 'useSnapshotRuns')
}

export function useSnapshotArchives(snapshot_at: number) {
  return useCachedQuery(
    api.openrouter.snapshot.getSnapshotArchives,
    { snapshot_at },
    `useSnapshotArchives (${snapshot_at})`,
  )
}
