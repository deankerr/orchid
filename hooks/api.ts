import { useQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'

export function useBulkModels() {
  return useQuery(api.frontend.getAll)
}
