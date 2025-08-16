/**
 * Reusable components and utilities for TanStack Table implementations
 * These help reduce repetition and maintain consistency across tables
 */

'use client'

import type { Column } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

// Sortable header component
interface SortableHeaderProps<TData> {
  column: Column<TData, unknown>
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

// Custom minimal monospace sort button for table headers
function TableSortButton({
  onClick,
  children,
  className,
  align = 'left',
  sorted,
}: {
  onClick: () => void
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
  sorted: false | 'asc' | 'desc'
}) {
  return (
    <button
      type="button"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center gap-1 border-none bg-transparent px-2 py-1 text-xs font-medium text-muted-foreground uppercase transition-colors outline-none select-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/50',
        'hover:bg-accent',
        align === 'right' && 'justify-end',
        align === 'center' && 'justify-center',
        className,
      )}
    >
      {children}
      {sorted === 'asc' ? (
        <ChevronUpIcon className="size-3 text-foreground-dim" />
      ) : sorted === 'desc' ? (
        <ChevronDownIcon className="size-3 text-foreground-dim" />
      ) : (
        <ChevronsUpDownIcon className="size-3 text-muted-foreground opacity-70" />
      )}
    </button>
  )
}

export function SortableHeader<TData>({
  column,
  children,
  className,
  align = 'left',
}: SortableHeaderProps<TData>) {
  const sorted = column.getIsSorted()

  return (
    <TableSortButton
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className={className}
      align={align}
      sorted={sorted}
    >
      {children}
    </TableSortButton>
  )
}

// Null-safe sorting function factory
export function createNullSafeSortingFn<T>(getValue: (row: T) => number | null | undefined) {
  return (rowA: { original: T }, rowB: { original: T }) => {
    const a = getValue(rowA.original) ?? 0
    const b = getValue(rowB.original) ?? 0
    return a - b
  }
}
