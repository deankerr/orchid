import { Settings2 } from 'lucide-react'

import { useDataGrid } from '../data-grid/data-grid'
import { DataGridColumnVisibility } from '../data-grid/data-grid-column-visibility'
import { SearchInput } from '../shared/search-input'
import { Button } from '../ui/button'

function ColumnsButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" size="sm" {...props}>
      <Settings2 />
      Columns
    </Button>
  )
}

export function Controls() {
  const { table } = useDataGrid()

  return (
    <>
      <SearchInput
        onValueChange={table.setGlobalFilter}
        label="Search models/providers..."
        placeholder="Search models/providers..."
        hideLabel
      />

      <DataGridColumnVisibility table={table} trigger={<ColumnsButton />} />
    </>
  )
}
