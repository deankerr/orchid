import { ArrowDown, ArrowUp } from 'lucide-react'

import { cn } from '@/lib/utils'

import { useEndpoints } from './provider'

export function EndpointsFrame({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'm-0.5 flex flex-1 flex-col overflow-hidden rounded-md border sm:m-1',
        className,
      )}
      {...props}
    />
  )
}

export function EndpointsToolbar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center gap-2 overflow-x-auto px-2 py-3', className)}
      {...props}
    />
  )
}

export function EndpointsFooter({ className, children, ...props }: React.ComponentProps<'div'>) {
  const { recordCount, isLoading, sorting, table } = useEndpoints()

  const currentSort = sorting[0]
  const sortedColumn = currentSort ? table.getColumn(currentSort.id) : null
  const sortedColumnTitle = sortedColumn?.columnDef.meta?.headerTitle || currentSort?.id

  return (
    <div
      className={cn(
        'grid h-9 grid-cols-3 items-center justify-items-center px-3 text-sm text-muted-foreground',
        className,
      )}
      {...props}
    >
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
    </div>
  )
}
