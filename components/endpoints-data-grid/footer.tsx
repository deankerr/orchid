import ms from 'ms'

import { api } from '@/convex/_generated/api'

import { useCachedQuery } from '@/hooks/use-cached-query'

import { useDataGrid } from '../data-grid/data-grid'
import { useEndpointFilters } from './use-endpoint-filters'

export function DataGridFooter() {
  const { table } = useDataGrid()
  const endpointsList = useCachedQuery(api.endpoints.list, { maxTimeUnavailable: ms('30d') })
  const { hasActiveFilters } = useEndpointFilters()

  if (!endpointsList) return null

  const totalEndpoints = endpointsList
  const filteredEndpoints = table.getFilteredRowModel().rows.map((row) => row.original)

  return (
    <div>
      {hasActiveFilters ? `${filteredEndpoints.length} /` : ''} {totalEndpoints.length} endpoints
    </div>
  )
}
