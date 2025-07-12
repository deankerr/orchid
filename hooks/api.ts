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
    R.groupBy(endpoints, (e) => `${e.model_slug}:${e.model_variant}`),
  ).map(([model_variant_slug, endpoints]) => {
    const totalRequests = endpoints.reduce((acc, endp) => acc + (endp.stats?.request_count ?? 0), 0)

    const [model_slug, model_variant] = model_variant_slug.split(':')
    const model = models.find((m) => m.slug === model_slug)!

    return {
      model_variant_slug,
      model,
      model_variant,
      tokens_7d: model.stats?.[model_variant]?.tokens_7d ?? 0,
      endpoints: endpoints.map((endp) => ({
        ...endp,
        traffic: endp.stats?.request_count ? endp.stats.request_count / totalRequests : undefined,
      })),
    }
  })

  return endpointsByVariant
}

export function useModelsList() {
  return useCachedQuery(api.openrouter.entities.models.list, {}, 'useModelsList')
}

export function useEndpointsList() {
  return useCachedQuery(api.openrouter.entities.endpoints.list, {}, 'useEndpointsList')
}

export type EndpointsMap = NonNullable<ReturnType<typeof useEndpointsMap>>
export type EndpointVariantsMap = EndpointsMap extends Map<any, infer V> ? V : never
export type Endpoint = (NonNullable<EndpointVariantsMap> extends Map<any, infer V>
  ? V
  : never)[number]
export function useEndpointsMap() {
  const result = useCachedQuery(api.openrouter.entities.endpoints.collect, {}, 'useEndpointsMap')
  if (!result) return result

  const map = new Map(
    result.map(([model_slug, endpointsByVariant]) => [model_slug, new Map(endpointsByVariant)]),
  )
  return map
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
