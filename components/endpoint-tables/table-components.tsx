/**
 * Reusable components and utilities for TanStack Table implementations
 * These help reduce repetition and maintain consistency across tables
 */

'use client'

import * as R from 'remeda'

import type { Column } from '@tanstack/react-table'
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  CircleCheckIcon,
} from 'lucide-react'

import type { Doc } from '@/convex/_generated/dataModel'

import { cn } from '@/lib/utils'

import { Badge } from '../ui/badge'

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
        'flex w-full items-center gap-1 border-none bg-transparent py-0.5 text-xs font-medium text-muted-foreground uppercase transition-colors outline-none select-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/50',
        'hover:bg-accent/40',
        align === 'right' && 'justify-end',
        align === 'center' && 'justify-center',
        className,
      )}
    >
      {children}
      {sorted === 'asc' ? (
        <ChevronUpIcon className="size-3" />
      ) : sorted === 'desc' ? (
        <ChevronDownIcon className="size-3" />
      ) : (
        <ChevronsUpDownIcon className="size-3 opacity-5" />
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

function formatNumber(value: number, decimals: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPriceToM(value: number | null | undefined) {
  if (typeof value === 'number') {
    return (value * 1_000_000).toFixed(2)
  }
}

export function formatPriceToK(value: number | null | undefined) {
  if (typeof value === 'number') {
    return (value * 1_000).toFixed(2)
  }
}

export function FormattedCell({
  value,
  className,
  decimals = 0,
  prefix,
  suffix,
}: {
  value?: string | number | null
  className?: string
  decimals?: number
  prefix?: string
  suffix?: string
}) {
  const formatted =
    typeof value === 'number' ? formatNumber(value, decimals) : R.isNullish(value) ? '-' : value

  return (
    <div
      className={cn(
        'flex flex-row items-baseline px-0.5',
        R.isNullish(value) && 'text-foreground-dim',
        className,
      )}
    >
      <span className={cn('pr-2 text-right align-middle text-xs text-foreground-dim')}>
        {prefix || ''}
      </span>
      <span className="flex-1 text-right">{formatted}</span>
      {suffix && (
        <span className="ml-0.5 align-middle text-[10px] text-foreground-dim">{suffix}</span>
      )}
    </div>
  )
}

// Null-safe sorting function factory
export function createNullSafeSortingFn<T>(getValue: (row: T) => number | null | undefined) {
  return (rowA: { original: T }, rowB: { original: T }) => {
    const a = getValue(rowA.original) ?? 1
    const b = getValue(rowB.original) ?? 1
    return a - b
  }
}

export function CapabilityBadge({ enabled, label }: { enabled: boolean; label: string }) {
  if (!enabled) return null
  return (
    <Badge variant="secondary" className="gap-1 text-[10px]">
      <CircleCheckIcon className="size-3" />
      {label}
    </Badge>
  )
}

export function DataPolicyIndicator({ policy }: { policy: Doc<'or_endpoints'>['data_policy'] }) {
  const hasIssues = policy.training || policy.retains_prompts
  if (!hasIssues) return null

  return (
    <div className="flex gap-1">
      {policy.training && (
        <Badge variant="outline" className="gap-1 text-[10px] text-warning">
          <AlertTriangleIcon className="size-3" />
          trains
        </Badge>
      )}
      {policy.retains_prompts && (
        <Badge variant="outline" className="gap-1 text-[10px] text-warning">
          <AlertTriangleIcon className="size-3" />
          retains
        </Badge>
      )}
    </div>
  )
}
