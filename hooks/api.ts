import { useQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'

export function useOrModel(slug: string) {
  return useQuery(api.frontend.getOrModel, { slug })
}

export function useOrModels() {
  return useQuery(api.frontend.listOrModels)
}

export function useOrEndpoints(slug: string) {
  return useQuery(api.frontend.listOrEndpoints, { slug })
}

// * dev queries
export function useBulkModels() {
  return useQuery(api.frontend.getAll)
}
