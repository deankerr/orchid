import { HTMLAttributes, ReactNode } from 'react'

import { Column } from '@tanstack/react-table'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useDataGrid } from './data-grid'

interface DataGridColumnHeaderProps<TData, TValue> extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title?: string
  subtitle?: string
  icon?: ReactNode
  pinnable?: boolean
  filter?: ReactNode
  visibility?: boolean
}

function DataGridColumnHeader<TData, TValue>({
  column,
  title = '',
  subtitle = '',
  icon,
  className,
}: DataGridColumnHeaderProps<TData, TValue>) {
  const { isLoading, props, recordCount } = useDataGrid()

  const isResizable = props.tableLayout?.columnsResizable && column.getCanResize()

  const headerLabel = () => {
    return (
      <div
        className={cn(
          'inline-flex h-full grow items-center justify-center gap-1.5 font-normal text-accent-foreground [&_svg]:size-3.5 [&_svg]:opacity-60',
          isResizable && 'pr-2.5', // offset resize handle
          className,
        )}
        data-slot="data-grid-header-label"
      >
        {icon && icon}
        {title}
      </div>
    )
  }

  const headerButton = () => {
    return (
      <Button
        variant="ghost"
        className={cn(
          '-ms-2 justify-center px-2 py-0.5 text-xs font-normal text-secondary-foreground hover:bg-secondary hover:text-foreground data-[state=open]:bg-secondary data-[state=open]:text-foreground',
          className,
        )}
        disabled={isLoading || recordCount === 0}
        onClick={column.getToggleSortingHandler()}
        data-slot="data-grid-header-button"
      >
        {icon && icon}
        <div className="">
          <div>{title}</div>
          {subtitle && <div className="text-muted-foreground">{subtitle}</div>}
        </div>

        {column.getCanSort() &&
          (column.getIsSorted() === 'desc' ? (
            <ChevronDown className="-ml-1 size-[0.7rem]!" />
          ) : column.getIsSorted() === 'asc' ? (
            <ChevronUp className="-ml-1 size-[0.7rem]!" />
          ) : (
            <ChevronsUpDown className="-ml-1 size-[0.7rem]!" />
          ))}
      </Button>
    )
  }

  // NOTE: removed unused: headerControls(), headerPin(), etc.

  // NOTE: removed isResizable check which prevented headerLabel from ever being used
  if (column.getCanSort()) {
    return headerButton()
  }

  return headerLabel()
}

export { DataGridColumnHeader, type DataGridColumnHeaderProps }
