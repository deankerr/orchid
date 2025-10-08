'use client'

import React, { useMemo, useState } from 'react'

import * as R from 'remeda'

import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { SearchCodeIcon } from 'lucide-react'

import type { Doc } from '@/convex/_generated/dataModel'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataGrid } from '@/components/ui/data-grid'
import { DataGridTable } from '@/components/ui/data-grid-table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatRelativeTime } from '@/lib/formatters'
import { calculatePercentageChange, cn } from '@/lib/utils'

import { fuzzyFilter } from '../data-grid/data-grid-fuzzy'
import { ModelCard, ProviderCard } from '../shared/entity-card'
import {
  AddIndicator,
  CreateBadge,
  DeleteBadge,
  DownArrow,
  PercentageBadge,
  RemoveIndicator,
  RightArrow,
} from './change-indicators'
import { ChangeItemValue } from './change-item'
import { parseChangeDoc, type ArrayChangeItem } from './parseChange'

type ChangeRow = Doc<'or_changes'>

export function ChangesDataGrid({
  changes,
  isLoading = false,
}: {
  changes: ChangeRow[]
  isLoading?: boolean
}) {
  const [selectedChange, setSelectedChange] = useState<ChangeRow | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const columns = useMemo<ColumnDef<ChangeRow>[]>(
    () => [
      {
        id: 'time',
        header: 'Time',
        accessorKey: 'crawl_id',
        cell: ({ getValue, row }) => {
          const timestamp = Number(getValue())
          const relativeTime = formatRelativeTime(timestamp, { format: 'long' })
          const fullDateTime = formatDateTime(timestamp)

          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                className="-ml-1.5 size-6 text-muted-foreground/50"
                size="icon"
                onClick={() => {
                  setSelectedChange(row.original)
                  setSheetOpen(true)
                }}
              >
                <SearchCodeIcon />
              </Button>

              <div
                className="w-20 flex-1 cursor-default font-mono text-xs text-muted-foreground"
                title={fullDateTime}
              >
                {relativeTime}
              </div>
            </div>
          )
        },
        size: 150,
        meta: {
          skeleton: <Skeleton className="h-6 w-20" />,
        },
      },

      {
        id: 'model',
        header: 'Model',
        cell: ({ row }) => {
          const change = row.original
          if (change.entity_type === 'model' || change.entity_type === 'endpoint') {
            return <ModelCard slug={change.model_variant_slug ?? 'unknown'} />
          }
          return <EmptyCell />
        },
        size: 290,
        meta: {
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'provider',
        header: 'Provider',
        cell: ({ row }) => {
          const change = row.original
          if (change.entity_type === 'endpoint' || change.entity_type === 'provider') {
            return <ProviderCard slug={change.provider_slug ?? 'unknown'} />
          }
          return <EmptyCell />
        },
        size: 225,
        meta: {
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'changeBody',
        header: 'Change',
        size: 480,
        meta: {
          skeleton: <Skeleton className="h-8 w-full" />,
        },
        cell: ({ row }) => {
          const change = parseChangeDoc(row.original)

          if (change.action !== 'update') {
            return (
              <div className="flex gap-4 font-mono">
                <Badge variant="outline" className="w-20 uppercase">
                  {change.entity}
                </Badge>

                {change.action === 'create' ? <CreateBadge /> : <DeleteBadge />}
              </div>
            )
          }

          return (
            <div className="grid grid-cols-[120px_96px_28px_96px_70px] place-items-center gap-x-2 gap-y-2 font-mono text-xs">
              {change.changes.map((c) => {
                const key = c.path.at(-1) ?? ''

                if (c.kind === 'value' && isBlockUpdate(c.oldValue, c.value)) {
                  return (
                    <BlockUpdate
                      key={c.path.join()}
                      keyName={key}
                      parentKeyName={c.path.at(-2)}
                      fromValue={c.oldValue}
                      toValue={c.value}
                    />
                  )
                }

                if (c.kind === 'value') {
                  return (
                    <ValueUpdate
                      key={c.path.join()}
                      keyName={key!}
                      parentKeyName={c.path.at(-2)}
                      fromValue={c.oldValue}
                      toValue={c.value}
                    />
                  )
                }

                return <ArrayUpdate key={c.path.join()} keyName={key} changes={c.changes} />
              })}
            </div>
          )
        },
      },
    ],
    [],
  )

  const table = useReactTable({
    columns,
    data: changes,
    filterFns: {
      fuzzy: fuzzyFilter, //define as a filter function that can be used in column definitions
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <DataGrid
        table={table}
        recordCount={changes.length}
        isLoading={isLoading}
        loadingMessage="Loading changes..."
        emptyMessage="No changes found"
        skeletonRows={20}
        tableLayout={{
          headerSticky: true,
          width: 'fixed',
          cellBorder: false,
        }}
      >
        <DataGridTable />
      </DataGrid>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Change Entry</SheetTitle>
            <SheetDescription>Raw change entry data</SheetDescription>
          </SheetHeader>
          <div className="overflow-auto">
            <pre className="p-4 pt-0 text-xs leading-relaxed break-words whitespace-pre-wrap">
              {selectedChange ? JSON.stringify(selectedChange, null, 2) : 'No data selected'}
            </pre>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function ChangeKey({ children, className, ...props }: React.ComponentProps<'div'>) {
  const processedChildren =
    typeof children === 'string'
      ? children.replace(/_/g, '_\u200B') // Insert zero-width space after underscores
      : children

  return (
    <span className={cn('justify-self-start', className)} {...props}>
      {processedChildren}
    </span>
  )
}

function isBlockUpdate(...values: unknown[]) {
  return values.some(
    (v) =>
      R.isObjectType(v) ||
      (R.isString(v) && (v.includes(' ') || v.length > 12) && isNaN(Number(v))),
  )
}

function ValueUpdate({
  keyName,
  fromValue,
  toValue,
  parentKeyName,
}: {
  keyName: string
  fromValue: unknown
  toValue: unknown
  parentKeyName?: string
}) {
  const percentageChange = calculatePercentageChange(fromValue, toValue)
  const invertPercentageColor =
    (parentKeyName === 'pricing' && keyName !== 'discount') || keyName.startsWith('limit_')

  return (
    <>
      <ChangeKey>{keyName}</ChangeKey>

      <span className="opacity-90">
        <ChangeItemValue value={fromValue} keyName={keyName} parentKeyName={parentKeyName} />
      </span>

      <RightArrow className="place-self-center" />

      <span>
        <ChangeItemValue value={toValue} keyName={keyName} parentKeyName={parentKeyName} />
      </span>

      <PercentageBadge invert={invertPercentageColor} value={percentageChange} />
    </>
  )
}

function BlockUpdate({
  keyName,
  fromValue,
  toValue,
  parentKeyName,
}: {
  keyName: string
  fromValue: unknown
  toValue: unknown
  parentKeyName?: string
}) {
  return (
    <>
      <ChangeKey>{keyName}</ChangeKey>

      <div className="col-span-4 flex flex-col items-center justify-center">
        <BlockValue>
          <ChangeItemValue value={fromValue} keyName={keyName} parentKeyName={parentKeyName} />
        </BlockValue>

        <DownArrow className="" />

        <BlockValue>
          <ChangeItemValue value={toValue} keyName={keyName} parentKeyName={parentKeyName} />
        </BlockValue>
      </div>
    </>
  )
}

function BlockValue({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'max-w-64 rounded-sm border border-border/50 bg-card/50 p-2 text-[95%] break-words text-card-foreground has-data-[slot=badge]:border-transparent has-data-[slot=badge]:bg-transparent has-data-[slot=badge]:p-0.5',
        className,
      )}
      {...props}
    />
  )
}

export function ArrayUpdate({ keyName, changes }: { keyName: string; changes: ArrayChangeItem[] }) {
  return (
    <>
      <ChangeKey>{keyName}</ChangeKey>
      <div className="col-span-4 flex flex-wrap gap-2 justify-self-start">
        {changes.map((change, idx) =>
          typeof change.value === 'string' ? (
            <Badge key={idx} variant="outline" className="font-normal">
              {change.type === 'ADD' ? <AddIndicator /> : <RemoveIndicator />}
              {change.value}
            </Badge>
          ) : (
            <BlockValue key={idx}>
              {change.type === 'ADD' ? (
                <AddIndicator className="mr-1" />
              ) : (
                <RemoveIndicator className="mr-1" />
              )}
              {JSON.stringify(change.value, null, 2)}
            </BlockValue>
          ),
        )}
      </div>
    </>
  )
}

function EmptyCell() {
  return <div className="text-muted-foreground/60">—</div>
}
