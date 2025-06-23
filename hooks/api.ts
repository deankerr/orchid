import { useQuery } from 'convex-helpers/react/cache/hooks'

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
