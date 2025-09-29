import { Settings2 } from 'lucide-react'

import { useDataGrid } from '../data-grid/data-grid'
import { DataGridColumnVisibility } from '../data-grid/data-grid-column-visibility'
import { DataGridFrameToolbar } from '../shared/data-grid-frame'
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

export function EndpointsDataGridControls() {
  const { table } = useDataGrid()

  return (
    <DataGridFrameToolbar>
      <SearchInput
        onValueChange={table.setGlobalFilter}
        label="Search models, providers, ids, etc."
        hideLabel
      />

      <DataGridColumnVisibility table={table} trigger={<ColumnsButton />} />
    </DataGridFrameToolbar>
  )
}
