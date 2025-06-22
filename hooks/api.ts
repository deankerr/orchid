import { useQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'

export function useOrModel(slug: string) {
  return useQuery(api.frontend.getOrModel, { slug })
}

export function useOrModels() {
  return useQuery(api.frontend.listOrModels)
}

// * dev queries
export function useBulkModels() {
  return useQuery(api.frontend.getAll)
}
