'use client'

import { useState } from 'react'

import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type GroupingState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'

import type { Doc } from '@/convex/_generated/dataModel'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type Endpoint } from '@/hooks/api'
import { cn } from '@/lib/utils'

import { endpointColumns } from './columns'

const columns: ColumnDef<Endpoint>[] = [
  {
    id: 'model_variant_slug',
    accessorFn: (row) => row.model_variant_slug,
    cell: ({ getValue }) => {
      return getValue()
    },
    enableGrouping: true,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.model_variant_slug
      const b = rowB.original.model_variant_slug
      if (a === b) return 0
      if (a === 'standard') return -1
      if (b === 'standard') return 1
      return a.localeCompare(b)
    },
    enableHiding: true,
  },

  ...endpointColumns,
]

// Default hidden columns - less commonly needed information
const DEFAULT_HIDDEN_COLUMNS: VisibilityState = {
  staleness: false,
  quantization: false,
  max_input: false,
  cache_read_price: false,
  reasoning_price: false,
  image_input_price: false,
  web_search_price: false,
  cache_write_price: false,
  per_request_price: false,
  capabilities: false,
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
  const [sorting, setSorting] = useState<SortingState>([{ id: 'traffic', desc: true }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(DEFAULT_HIDDEN_COLUMNS)
  const [grouping, setGrouping] = useState<GroupingState>(['model_variant_slug'])

  const table = useReactTable({
    data: endpoints,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: true, // prevents state update on initial render error
    initialState: {
      expanded: true,
    },
    state: {
      sorting,
      columnVisibility,
      grouping,
    },
  })

  return (
    <div className="space-y-2 font-mono">
      <div className="flex items-center justify-between px-3">
        <div className="font-medium">Endpoints</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="font-mono text-xs">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="font-mono text-xs capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/_/g, ' ')}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                // Skip rendering TableHead for variant column since it's only used for grouping
                if (header.column.id === 'model_variant_slug') {
                  return null
                }
                return (
                  <TableHead key={header.id} className="text-xs">
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
                className={cn(
                  'border-b-transparent',
                  row.getIsGrouped() && 'hover:bg-transparent',
                  !row.getIsGrouped() && row.original.staleness_hours > 6 && 'opacity-50',
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  // For grouped rows, only render the variant column cell and span it across all columns
                  if (row.getIsGrouped()) {
                    if (cell.column.id === 'model_variant_slug') {
                      return (
                        <TableCell
                          key={cell.id}
                          className="border-b px-2.5 text-xs font-medium text-muted-foreground"
                          colSpan={table.getVisibleLeafColumns().length}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      )
                    } else {
                      return null
                    }
                  }

                  // Regular row - render all cells normally, but skip variant column
                  if (cell.column.id === 'model_variant_slug') {
                    return null
                  }
                  return (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
