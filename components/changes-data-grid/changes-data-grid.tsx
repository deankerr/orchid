'use client'

import React, { useMemo } from 'react'

import * as R from 'remeda'

import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { formatISO9075 } from 'date-fns'

import type { Doc } from '@/convex/_generated/dataModel'

import { Badge } from '@/components/ui/badge'
import { DataGrid, DataGridContainer } from '@/components/ui/data-grid'
import { DataGridTable } from '@/components/ui/data-grid-table'
import { Skeleton } from '@/components/ui/skeleton'
import { calculatePercentageChange, cn } from '@/lib/utils'

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
import { ModelNameCell, ProviderNameCell } from './entity-cells'
import { parseChangeDoc, type ArrayChangeItem } from './parseChange'

type ChangeRow = Doc<'or_changes'>

export function ChangesDataGrid({
  changes,
  isLoading = false,
}: {
  changes: ChangeRow[]
  isLoading?: boolean
}) {
  const columns = useMemo<ColumnDef<ChangeRow>[]>(
    () => [
      {
        id: 'time',
        header: 'Time',
        accessorKey: 'crawl_id',
        cell: ({ getValue }) => {
          const timestamp = Number(getValue())
          const date = new Date(timestamp)

          const formatDate = (date: Date) => {
            try {
              return formatISO9075(date)
            } catch (err) {
              console.error(err)
              return timestamp
            }
          }
          return (
            <div className="w-20 font-mono text-xs text-muted-foreground">{formatDate(date)}</div>
          )
        },
        size: 96,
        meta: {
          skeleton: <Skeleton className="h-10 w-20" />,
        },
      },

      {
        id: 'model',
        header: 'Model',
        cell: ({ row }) => {
          const change = row.original
          if (change.entity_type === 'endpoint' && change.model_variant_slug) {
            return <ModelNameCell id={change.model_variant_slug} />
          }
          if (change.entity_type === 'model') {
            return <ModelNameCell id={change.model_variant_slug ?? 'unknown'} />
          }
          return <div className="text-muted-foreground">—</div>
        },
        size: 260,
        meta: {
          skeleton: <Skeleton className="h-10 w-full" />,
        },
      },

      {
        id: 'provider',
        header: 'Provider',
        cell: ({ row }) => {
          const change = row.original
          if (change.entity_type === 'endpoint' || change.entity_type === 'provider') {
            return <ProviderNameCell id={change.provider_slug ?? 'unknown'} />
          }
          return <div className="text-muted-foreground">—</div>
        },
        size: 180,
        meta: {
          skeleton: <Skeleton className="h-10 w-full" />,
        },
      },

      {
        id: 'changeBody',
        header: 'Change',
        size: 480,
        meta: {
          skeleton: <Skeleton className="h-10 w-full" />,
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
    data: changes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <DataGridContainer className="overflow-auto">
      <DataGrid
        table={table}
        recordCount={changes.length}
        isLoading={isLoading}
        loadingMessage="Loading changes..."
        emptyMessage="No changes found"
        tableLayout={{
          headerSticky: true,
          rowBorder: true,
          headerBackground: true,
          headerBorder: true,
        }}
      >
        <DataGridTable />
      </DataGrid>
    </DataGridContainer>
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
  return values.some((v) => R.isString(v) && (v.includes(' ') || v.length > 12) && isNaN(Number(v)))
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
        {changes.map((change, idx) => (
          <Badge key={idx} variant="outline" className="font-normal">
            {change.type === 'ADD' ? <AddIndicator /> : <RemoveIndicator />}
            {typeof change.value === 'string' ? change.value : '{...}'}
          </Badge>
        ))}
      </div>
    </>
  )
}
