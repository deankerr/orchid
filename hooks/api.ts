import { useMemo } from 'react'

import { api } from '@/convex/_generated/api'

import { useCachedQuery } from './use-cached-query'

export type Model = NonNullable<ReturnType<typeof useModelsList>>[number]
export function useModelsList() {
  return useCachedQuery(api.public.models.list, {}, 'useModelsList')
}

export type Endpoint = NonNullable<ReturnType<typeof useEndpointsList>>[number]
export function useEndpointsList() {
  return useCachedQuery(api.public.endpoints.list, {}, 'useEndpointsList')
}

export function useModelData(slug: string) {
  const modelsList = useModelsList()
  const endpointsList = useEndpointsList()

  const modelData = useMemo(() => {
    if (!modelsList) return
    const model = modelsList.find((m) => m.slug === slug)
    if (!model) return null
    return { ...model, endpoints: endpointsList?.filter((e) => e.model_slug === slug) }
  }, [endpointsList, modelsList, slug])

  return modelData
}

export function useEndpointUptimes(endpoint_uuid: string) {
  return useCachedQuery(
    api.public.endpointUptimes.getLatest,
    { endpoint_uuid },
    `useEndpointUptimes (${endpoint_uuid})`,
  )
}

type Nullish<T> = T | null | undefined

export function useModelAppsLeaderboards(args: Nullish<{ permaslug: string; variants: string[] }>) {
  return useCachedQuery(
    api.public.modelAppLeaderboards.get,
    args ? { permaslug: args.permaslug, variants: args.variants } : 'skip',
    `useModelAppsLeaderboard (${args?.permaslug}, ${args?.variants.join(', ')})`,
  )
}

export function useModelTokenStats(args: Nullish<{ permaslug: string; variants: string[] }>) {
  return useCachedQuery(
    api.public.modelTokenStats.get,
    args ? { permaslug: args.permaslug, variants: args.variants } : 'skip',
    `useModelTokenStats (${args?.permaslug}, ${args?.variants.join(', ')})`,
  )
}

export function useProvidersList() {
  return useCachedQuery(api.public.providers.list, {})
}

export function useSnapshotStatus() {
  return useCachedQuery(api.public.snapshots.getSnapshotStatus, {}, 'useSnapshotStatus')
}

export function useSnapshotRuns(limit?: number) {
  return useCachedQuery(api.public.snapshots.getSnapshotRuns, { limit }, 'useSnapshotRuns')
}

export function useSnapshotArchives(snapshot_at: number) {
  return useCachedQuery(
    api.public.snapshots.getSnapshotArchives,
    { snapshot_at },
    `useSnapshotArchives (${snapshot_at})`,
  )
}
