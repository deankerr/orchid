import { api } from '@/convex/_generated/api'

import { useCachedQuery } from './use-cached-query'

export function useModelsList() {
  return useCachedQuery(api.views.models.list, {}, 'useModelsList')
}

export function useProvidersList() {
  return useCachedQuery(api.views.providers.list, {})
}
