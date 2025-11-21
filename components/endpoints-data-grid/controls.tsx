import { Settings2, XIcon } from 'lucide-react'

import { useDataGrid } from '../data-grid/data-grid'
import { DataGridColumnVisibility } from '../data-grid/data-grid-column-visibility'
import { SearchInput } from '../shared/search-input'
import { Button } from '../ui/button'
import { AttributeFilterControls, ModalityFilterControls } from './attribute-filter-controls'
import { useEndpointFilters } from './use-endpoint-filters'

function ColumnsButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" {...props}>
      <Settings2 />
      Columns
    </Button>
  )
}

function EndpointsSearchInput() {
  const { globalFilter, setGlobalFilter } = useEndpointFilters()

  return (
    <SearchInput
      value={globalFilter}
      onValueChange={setGlobalFilter}
      label="Search models/providers..."
      placeholder="Search models/providers..."
      hideLabel
    />
  )
}

export function DataGridControls() {
  const { table } = useDataGrid()
  const { hasActiveAttributeFilters, hasActiveModalityFilters, clearAllFilters } =
    useEndpointFilters()

  const hasAnyFilter = hasActiveAttributeFilters || hasActiveModalityFilters

  return (
    <div className="flex items-center gap-2 px-3 py-4">
      <EndpointsSearchInput />
      <ModalityFilterControls />
      <AttributeFilterControls />

      {hasAnyFilter && (
        <Button variant="secondary" onClick={clearAllFilters}>
          <XIcon />
          Clear
        </Button>
      )}

      <div className="flex-1" />

      <DataGridColumnVisibility table={table} trigger={<ColumnsButton />} />
    </div>
  )
}
