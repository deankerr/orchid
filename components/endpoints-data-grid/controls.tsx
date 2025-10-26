import { Grid3x3, Settings2, XIcon } from 'lucide-react'

import { useDataGrid } from '../data-grid/data-grid'
import { DataGridColumnVisibility } from '../data-grid/data-grid-column-visibility'
import { SearchInput } from '../shared/search-input'
import { Button } from '../ui/button'
import { Toggle } from '../ui/toggle'
import { AttributeFilterControls } from './attribute-filter-controls'
import { useEndpointFilters } from './use-endpoint-filters'

function ColumnsButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" size="sm" {...props}>
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

export function Controls({
  cellBorder,
  setCellBorder,
}: {
  cellBorder: boolean
  setCellBorder: (value: boolean) => void
}) {
  const { table } = useDataGrid()
  const { hasActiveFilters, hasActiveSorting, clearAllFilters } = useEndpointFilters()

  return (
    <>
      <EndpointsSearchInput />
      <AttributeFilterControls />

      {(hasActiveFilters || hasActiveSorting) && (
        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
          <XIcon />
          Clear
        </Button>
      )}

      <div className="flex-1" />

      <Toggle
        variant="outline"
        pressed={cellBorder}
        onPressedChange={setCellBorder}
        aria-label="Toggle cell borders"
      >
        <Grid3x3 />
      </Toggle>

      <DataGridColumnVisibility table={table} trigger={<ColumnsButton />} />
    </>
  )
}
