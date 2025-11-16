import { useDataGrid } from '../data-grid/data-grid'
import { useEndpointsData } from './api'
import { useEndpointFilters } from './use-endpoint-filters'

export function DataGridFooter() {
  const { table } = useDataGrid()
  const { rawEndpoints } = useEndpointsData()
  const { hasActiveFilters } = useEndpointFilters()

  if (!rawEndpoints) return null

  const filteredEndpoints = table.getFilteredRowModel().rows.map((row) => row.original)

  return (
    <div>
      {hasActiveFilters ? `${filteredEndpoints.length} /` : ''} {rawEndpoints.length} endpoints
    </div>
  )
}
