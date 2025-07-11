import { useEffect, useRef } from 'react'

import { useQuery } from 'convex-helpers/react/cache/hooks'
import * as R from 'remeda'

import { api } from '@/convex/_generated/api'

function useQueryTimer<T>(result: T, label: string): T {
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (result === undefined && startTimeRef.current === null) {
      startTimeRef.current = performance.now()
    } else if (result !== undefined && startTimeRef.current !== null) {
      const currentTime = new Date().toTimeString().slice(0, 8)
      const timing = `${(performance.now() - startTimeRef.current).toFixed(0)}ms`
      const count = Array.isArray(result) ? `(${result.length})` : typeof result

      console.groupCollapsed(
        `%c${currentTime} %c${label} %c${timing}${count ? ` %c${count}` : ''}`,
        'color: #AAA; font-weight: normal',
        '',
        'color: #0ea5e9; font-weight: bold',
        'color: #10b981; font-weight: bold',
      )
      console.log(result)
      console.groupEnd()
      startTimeRef.current = null
    }
  }, [result, label])

  return result
}

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
  const result = useQuery(api.openrouter.entities.models.list)
  return useQueryTimer(result, 'useModelsList')
}

export function useEndpointsList() {
  const result = useQuery(api.openrouter.entities.endpoints.list)
  return useQueryTimer(result, 'useEndpointsList')
}

export function useEndpointUptimes(endpoint_uuid: string) {
  const result = useQuery(api.openrouter.entities.endpointUptimes.getLatest, { endpoint_uuid })
  return useQueryTimer(result, `useEndpointUptimes (${endpoint_uuid})`)
}

export function useModelAppsLeaderboards(permaslug?: string) {
  const result = useQueryTimer(
    useQuery(api.openrouter.entities.modelAppLeaderboards.get, permaslug ? { permaslug } : 'skip'),
    `useModelAppsLeaderboard (${permaslug})`,
  )

  return result ? new Map(result) : undefined
}

export function useModelTokenMetrics(permaslug?: string) {
  const result = useQuery(
    api.openrouter.entities.modelTokenMetrics.getLatest,
    permaslug ? { permaslug } : 'skip',
  )
  return useQueryTimer(result, `useModelTokenMetrics (${permaslug})`)
}

export function useProvidersList() {
  const result = useQuery(api.openrouter.entities.providers.list)
  return useQueryTimer(result, 'useProvidersList')
}

export function useSnapshotStatus() {
  const result = useQuery(api.openrouter.snapshot.getSnapshotStatus)
  return useQueryTimer(result, 'useSnapshotStatus')
}

export function useSnapshotRuns(limit?: number) {
  const result = useQuery(api.openrouter.snapshot.getSnapshotRuns, { limit })
  return useQueryTimer(result, 'useSnapshotRuns')
}

export function useSnapshotArchives(snapshot_at: number) {
  const result = useQuery(api.openrouter.snapshot.getSnapshotArchives, { snapshot_at })
  return useQueryTimer(result, `useSnapshotArchives (${snapshot_at})`)
}
