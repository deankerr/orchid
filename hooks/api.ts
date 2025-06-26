import { useEffect, useRef } from 'react'

import { useQuery } from 'convex-helpers/react/cache/hooks'

import { api } from '@/convex/_generated/api'

function useQueryTimer<T>(result: T, label: string): T {
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (result === undefined && startTimeRef.current === null) {
      startTimeRef.current = performance.now()
    } else if (result !== undefined && startTimeRef.current !== null) {
      console.log(label, [
        `${(performance.now() - startTimeRef.current).toFixed(0)}ms`,
        Array.isArray(result) ? `${result.length}n` : '',
      ])
      startTimeRef.current = null
    }
  }, [result, label])

  return result
}

export function useOrModels() {
  const result = useQuery(api.frontend.listOrModels)
  return useQueryTimer(result, 'useOrModels')
}

export function useOrEndpoints(slug: string) {
  const result = useQuery(api.frontend.listOrEndpoints, { slug })
  return useQueryTimer(result, `useOrEndpoints(${slug})`)
}

export function useOrTopAppsForModel(slug: string) {
  const result = useQuery(api.frontend.getOrTopAppsForModel, { slug })
  return useQueryTimer(result, `useOrTopAppsForModel(${slug})`)
}

export function useOrModelTokenMetrics(slug: string) {
  const result = useQuery(api.frontend.getOrModelTokenMetrics, { slug })
  return useQueryTimer(result, `useOrModelTokenMetrics(${slug})`)
}
