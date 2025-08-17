import { useMemo } from 'react'

import { omit } from 'convex-helpers'

import { api } from '@/convex/_generated/api'

import { useCachedQuery } from './use-cached-query'

export type Model = NonNullable<ReturnType<typeof useModelsList>>[number]
export function useModelsList() {
  return useCachedQuery(api.db.or.models.list, {}, 'useModelsList')
}

export type Endpoint = NonNullable<ReturnType<typeof useEndpointsList>>[number]
export function useEndpointsList() {
  return useCachedQuery(api.db.or.endpoints.list, {}, 'useEndpointsList')
}

export function useModelData(slug: string) {
  const modelsList = useModelsList()
  const endpointsList = useEndpointsList()

  const modelDetails = useCachedQuery(api.db.or.modelDetails.get, { slug }, 'useModelDetails')

  const modelData = useMemo(() => {
    if (!modelsList) return
    const model = modelsList.find((m) => m.slug === slug)
    if (!model) return null

    const details = modelDetails ? omit(modelDetails, ['_id', '_creationTime']) : undefined
    return {
      ...model,
      ...details,
      endpoints: endpointsList?.filter((e) => e.model_slug === slug),
    }
  }, [endpointsList, modelsList, modelDetails, slug])

  return modelData
}

type Nullish<T> = T | null | undefined

export function useModelAppsLeaderboards(args: Nullish<{ permaslug: string; variants: string[] }>) {
  return useCachedQuery(
    api.db.or.modelAppLeaderboards.get,
    args ? { permaslug: args.permaslug, variants: args.variants } : 'skip',
    `useModelAppsLeaderboard (${args?.permaslug}, ${args?.variants.join(', ')})`,
  )
}

export function useModelTokenStats(args: Nullish<{ permaslug: string; variants: string[] }>) {
  return useCachedQuery(
    api.db.or.modelTokenStats.get,
    args ? { permaslug: args.permaslug, variants: args.variants } : 'skip',
    `useModelTokenStats (${args?.permaslug}, ${args?.variants.join(', ')})`,
  )
}

export function useProvidersList() {
  return useCachedQuery(api.db.or.providers.list, {})
}
