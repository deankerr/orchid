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

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { Badge } from '../ui/badge'

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
}: {
  value?: string | number | null
  className?: string
  decimals?: number
}) {
  const formatted =
    typeof value === 'number' ? formatNumber(value, decimals) : R.isNullish(value) ? '-' : value
  return (
    <div className={cn('px-0.5', R.isNullish(value) && 'text-muted-foreground', className)}>
      {formatted}
    </div>
  )
}

// Null-safe sorting function factory
export function createNullSafeSortingFn<T>(getValue: (row: T) => number | null | undefined) {
  return (rowA: { original: T }, rowB: { original: T }) => {
    const a = getValue(rowA.original) ?? Number.NEGATIVE_INFINITY
    const b = getValue(rowB.original) ?? Number.NEGATIVE_INFINITY
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
