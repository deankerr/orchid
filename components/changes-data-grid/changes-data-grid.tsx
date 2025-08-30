'use client'

import { useMemo } from 'react'

import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { formatISO9075 } from 'date-fns'

import type { Doc } from '@/convex/_generated/dataModel'

import { Badge } from '@/components/ui/badge'
import { DataGrid, DataGridContainer } from '@/components/ui/data-grid'
import { DataGridTable } from '@/components/ui/data-grid-table'
import { Skeleton } from '@/components/ui/skeleton'
import { parseChangeBody } from '@/lib/change-body-parser'

import { ArrayValuesUpdate } from './array-values-update'
import { CreateBadge, DeleteBadge } from './change-indicators'
import { ChangeItem } from './change-item'
import { ChangeKey } from './change-key'
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
            <div className="w-20 font-mono text-xs text-muted-foreground">
              {formatISO9075(date)}
            </div>
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
        id: 'details',
        header: 'Change',
        cell: ({ row }) => {
          const change = row.original

          if (change.change_action === 'create' || change.change_action === 'delete') {
            return (
              <div className="flex items-center gap-3 font-mono uppercase *:min-w-24">
                {change.change_action === 'create' ? <CreateBadge /> : <DeleteBadge />}
                <Badge variant="outline" className="text-sm uppercase">
                  {change.entity_type}
                </Badge>
              </div>
            )
          }

          if (change.change_action === 'update') {
            const parsed = parseChangeBody(change.change_body)

            return (
              <div className="divide-y divide-border/30 font-mono [&>div]:py-2">
                {parsed.type === 'array_change' ? (
                  <ArrayValuesUpdate keyName={parsed.key} changes={parsed.changes} />
                ) : parsed.type === 'value_change' ? (
                  <ChangeItem
                    keyName={parsed.key}
                    fromValue={parsed.oldValue}
                    toValue={parsed.newValue}
                  />
                ) : parsed.type === 'record_change' ? (
                  parsed.changes.map((c) =>
                    c.shape.type === 'value_change' ? (
                      <ChangeItem
                        key={c.key}
                        parentKeyName={parsed.key}
                        keyName={c.key}
                        fromValue={c.shape.oldValue}
                        toValue={c.shape.newValue}
                      />
                    ) : c.shape.type === 'array_change' ? (
                      <ArrayValuesUpdate key={c.key} keyName={c.key} changes={c.shape.changes} />
                    ) : (
                      <div key={c.key} className="flex items-center gap-3 text-muted-foreground">
                        <ChangeKey>
                          {parsed.key}.{c.key}
                        </ChangeKey>{' '}
                        {`{...}`}
                      </div>
                    ),
                  )
                ) : (
                  <div className="text-muted-foreground">{parsed.key}</div>
                )}
              </div>
            )
          }

          return <div className="text-muted-foreground">—</div>
        },
        size: 370,
        meta: {
          skeleton: <Skeleton className="h-10 w-full" />,
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
