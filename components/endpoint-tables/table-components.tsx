/**
 * Reusable components and utilities for TanStack Table implementations
 * These help reduce repetition and maintain consistency across tables
 */

'use client'

import type { Column } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Sortable header component
interface SortableHeaderProps<TData> {
  column: Column<TData, unknown>
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

export function SortableHeader<TData>({
  column,
  children,
  className,
  align = 'left',
}: SortableHeaderProps<TData>) {
  const sorted = column.getIsSorted()

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'h-8 w-full justify-start text-xs',
        align === 'right' && 'flex-row-reverse justify-end',
        align === 'center' && 'justify-center',
        className,
      )}
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {children}
      {sorted === 'asc' ? (
        <ChevronUpIcon className="size-3" />
      ) : sorted === 'desc' ? (
        <ChevronDownIcon className="size-3" />
      ) : (
        <ChevronsUpDownIcon className="size-3 opacity-5" />
      )}
    </Button>
  )
}

// Null-safe sorting function factory
export function createNullSafeSortingFn<T>(getValue: (row: T) => number | null | undefined) {
  return (rowA: { original: T }, rowB: { original: T }) => {
    const a = getValue(rowA.original) ?? -1
    const b = getValue(rowB.original) ?? -1
    return a - b
  }
}

// Null-safe accessor function factory
export function createNullSafeAccessor<T>(
  getValue: (row: T) => number | null | undefined,
  defaultValue = -1,
) {
  return (row: T) => getValue(row) ?? defaultValue
}
