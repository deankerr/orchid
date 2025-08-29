'use client'

import { useMemo } from 'react'

import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { formatISO9075 } from 'date-fns'

import type { Doc } from '@/convex/_generated/dataModel'

import { DataGrid, DataGridContainer } from '@/components/ui/data-grid'
import { DataGridTable } from '@/components/ui/data-grid-table'
import { Skeleton } from '@/components/ui/skeleton'

import { CompactChangeRenderer } from './change-body-renderers'
import { ModelNameCell, ProviderNameCell } from './entity-cells'

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
          return (
            <div className="font-mono text-xs text-muted-foreground">{formatISO9075(date)}</div>
          )
        },
        meta: {
          headerClassName: 'w-20',
          skeleton: <Skeleton className="h-5 w-20" />,
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
        meta: {
          headerClassName: 'min-w-48',
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
        meta: {
          headerClassName: 'min-w-48',
          skeleton: <Skeleton className="h-10 w-full" />,
        },
      },

      {
        id: 'details',
        header: 'Change',
        cell: ({ row }) => {
          const change = row.original

          if (change.change_action === 'create') {
            return (
              <div className="font-mono text-sm text-success">{change.entity_type} created</div>
            )
          }

          if (change.change_action === 'delete') {
            return (
              <div className="font-mono text-sm text-destructive">{change.entity_type} deleted</div>
            )
          }

          if (change.change_action === 'update') {
            return (
              <div className="space-y-1 font-mono">
                <CompactChangeRenderer changeBody={change.change_body} />
              </div>
            )
          }

          return <div className="text-muted-foreground">—</div>
        },
        size: 99999, // Allow this column to grow
        meta: {
          headerClassName: 'min-w-48',
          skeleton: <Skeleton className="h-5 w-32" />,
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
          width: 'auto', // Allow table to size columns naturally
        }}
      >
        <DataGridTable />
      </DataGrid>
    </DataGridContainer>
  )
}
