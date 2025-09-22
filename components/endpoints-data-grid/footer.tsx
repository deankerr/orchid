import { ArrowDown, ArrowUp } from 'lucide-react'

import { DataGridFrameFooter } from '../shared/data-grid-frame'
import { useEndpoints } from './data-grid'

export function EndpointsDataGridFooter({ children, ...props }: React.ComponentProps<'div'>) {
  const { recordCount, isLoading, sorting, table } = useEndpoints()

  const currentSort = sorting[0]
  const sortedColumn = currentSort ? table.getColumn(currentSort.id) : null
  const sortedColumnTitle = sortedColumn?.columnDef.meta?.headerTitle || currentSort?.id

  return (
    <DataGridFrameFooter {...props}>
      <div className="justify-self-start">{children}</div>

      <div className="flex items-center gap-1 text-xs">
        {isLoading && <div>Loading...</div>}
        {!isLoading && currentSort && (
          <>
            {currentSort.desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            <span>Sorted by {sortedColumnTitle}</span>
          </>
        )}
      </div>

      <div className="justify-self-end font-mono text-xs">{recordCount} items loaded</div>
    </DataGridFrameFooter>
  )
}
