import { Settings2, XIcon } from 'lucide-react'

import { DataGridColumnVisibility } from '../data-grid/data-grid-column-visibility'
import { FeatureFlag } from '../dev-utils/feature-flag'
import { DataGridFrameToolbar } from '../shared/data-grid-frame'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { SearchInput } from '../ui/search-input'

export function EndpointsDataGridControls() {
  return (
    <DataGridFrameToolbar>
      {/* <SearchInput
        placeholder="Search models and providers..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter?.(e.target.value)}
        onClear={() => setGlobalFilter?.('')}
        className="w-64"
      /> */}

      {/* <DataGridColumnVisibility
        table={table}
        trigger={
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4" />
            Columns
          </Button>
        }
      /> */}
    </DataGridFrameToolbar>
  )
}
