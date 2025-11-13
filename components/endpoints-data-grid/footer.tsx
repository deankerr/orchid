import { api } from '@/convex/_generated/api'

import { useCachedQuery } from '@/hooks/use-cached-query'

import { useDataGrid } from '../data-grid/data-grid'
import { useEndpointFilters } from './use-endpoint-filters'

export function DataGridFooter() {
  const { table } = useDataGrid()
  const endpointsList = useCachedQuery(api.db.or.views.endpoints.all, {}, 'endpoints-all')
  const { hasActiveFilters } = useEndpointFilters()

  if (!endpointsList) return null

  const totalEndpoints = endpointsList
  const totalModelsCount = new Set(totalEndpoints.map((endp) => endp.model.slug)).size

  const totalAvailableEndpoints = totalEndpoints.filter((endp) => !endp.unavailable_at)
  const totalAvailableModelsCount = new Set(totalAvailableEndpoints.map((endp) => endp.model.slug))
    .size

  const filteredEndpoints = table.getFilteredRowModel().rows.map((row) => row.original)
  const filteredModelsCount = new Set(filteredEndpoints.map((endp) => endp.model.slug)).size

  return (
    <div className="flex flex-wrap justify-center gap-x-4">
      <div>
        Models:{' '}
        {hasActiveFilters
          ? `${filteredModelsCount} filtered`
          : `${totalAvailableModelsCount} available`}{' '}
        ({totalModelsCount} total)
      </div>
      <div>
        Endpoints:{' '}
        {hasActiveFilters
          ? `${filteredEndpoints.length} filtered`
          : `${totalAvailableEndpoints.length} available`}{' '}
        ({totalEndpoints.length} total)
      </div>
    </div>
  )
}
