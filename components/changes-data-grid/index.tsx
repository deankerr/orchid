'use client'

import { useMemo } from 'react'

import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { formatISO9075 } from 'date-fns'

import type { Doc } from '@/convex/_generated/dataModel'

import { DataGrid, DataGridContainer } from '@/components/ui/data-grid'
import { DataGridTable } from '@/components/ui/data-grid-table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { CompactChangeRenderer } from './change-body-renderers'

type ChangeRow = Doc<'or_changes'>

// TODO: Add real avatar component when available
function EntityAvatar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-sm bg-muted/60 font-mono text-xs',
        className,
      )}
    >
      {typeof children === 'string' ? children.slice(0, 2).toUpperCase() : children}
    </div>
  )
}

// TODO: Enhance with proper model/provider data lookup
function EntityNameCell({
  displayName,
  id,
}: {
  entityType: string
  displayName: string
  id?: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <EntityAvatar>{displayName}</EntityAvatar>
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-sm">{displayName}</div>
        {id && <div className="truncate font-mono text-xs text-muted-foreground">{id}</div>}
      </div>
    </div>
  )
}

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
        header: 'TIME',
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

      // TODO: For endpoint changes, we need both model and provider columns
      {
        id: 'model',
        header: 'MODEL',
        cell: ({ row }) => {
          const change = row.original
          if (change.entity_type === 'endpoint' && change.model_variant_slug) {
            return (
              <EntityNameCell
                entityType="model"
                displayName={change.model_variant_slug}
                id={change.model_variant_slug}
              />
            )
          }
          if (change.entity_type === 'model') {
            return (
              <EntityNameCell
                entityType="model"
                displayName={change.entity_display_name}
                id={change.model_variant_slug}
              />
            )
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
        header: 'PROVIDER',
        cell: ({ row }) => {
          const change = row.original
          if (
            (change.entity_type === 'endpoint' || change.entity_type === 'provider') &&
            change.provider_id
          ) {
            return (
              <EntityNameCell
                entityType="provider"
                displayName={change.provider_id}
                id={change.provider_id}
              />
            )
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
        header: 'CHANGE',
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
