import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'

export function useBulkModels() {
  return useQuery(api.frontend.getAll)
}
