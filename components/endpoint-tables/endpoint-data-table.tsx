'use client'

import { useState } from 'react'

import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'

import type { Doc } from '@/convex/_generated/dataModel'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type Endpoint } from '@/hooks/api'

import { ColumnVisibilityMenu } from './column-visibility-toggle'
import { endpointColumns } from './columns'

// Default hidden columns - less commonly needed information
const DEFAULT_HIDDEN_COLUMNS: VisibilityState = {
  max_input: false,
  cache_read_price: false,
  reasoning_price: false,
  image_input_price: false,
  web_search_price: false,
  cache_write_price: false,
  per_request_price: false,
  rpm_limit: false,
  rpd_limit: false,
  images_per_prompt: false,
  tokens_per_image: false,
  data_policy: false,
  is_moderated: false,
}

interface EndpointDataTableProps {
  model: Doc<'or_models'>
  endpoints: Endpoint[]
  defaultHiddenColumns?: VisibilityState
}

export function EndpointDataTable({ model: _model, endpoints }: EndpointDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'provider', desc: false }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(DEFAULT_HIDDEN_COLUMNS)

  const table = useReactTable({
    data: endpoints,
    columns: endpointColumns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: true, // prevents state update on initial render error
    initialState: {
      expanded: true,
    },
    state: {
      sorting,
      columnVisibility,
    },
  })

  return (
    <div className="space-y-0.5 font-mono">
      <div className="flex items-center justify-between gap-2 border-b pb-1">
        <div className="text-base font-medium">Endpoint Comparison</div>
        <ColumnVisibilityMenu table={table} />
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b-transparent hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="h-8 min-w-20 px-0">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="border-b-transparent"
              >
                {row.getVisibleCells().map((cell) => {
                  return (
                    <TableCell key={cell.id} className="">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={endpointColumns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
