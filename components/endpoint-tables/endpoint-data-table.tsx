'use client'

import { useMemo, useState } from 'react'

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { AlertTriangleIcon, CircleCheckIcon, OctagonXIcon } from 'lucide-react'

import type { Doc } from '@/convex/_generated/dataModel'

import { ProviderBrandIcon } from '@/components/brand-icon'
import { Badge } from '@/components/ui/badge'
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

import { createNullSafeAccessor, createNullSafeSortingFn, SortableHeader } from './table-components'

// Price formatting utility
function formatPrice(value: number | null | undefined): string {
  if (!value) return '—'
  return (value * 1_000_000).toFixed(2)
}

// Enhanced cell component with built-in formatting
function FormattedCell({
  value,
  className,
  decimals = 0,
}: {
  value?: string | number | null
  className?: string
  decimals?: number
}) {
  if (value === null || value === undefined) return <div className={className}>—</div>
  if (typeof value === 'string') return <div className={className}>{value}</div>

  // Use Intl.NumberFormat for proper number formatting
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)

  return <div className={className}>{formatted}</div>
}

function CapabilityBadge({ enabled, label }: { enabled: boolean; label: string }) {
  if (!enabled) return null
  return (
    <Badge variant="secondary" className="gap-1 text-[10px]">
      <CircleCheckIcon className="size-3" />
      {label}
    </Badge>
  )
}

function DataPolicyIndicator({ policy }: { policy: Doc<'or_endpoints'>['data_policy'] }) {
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

export function createColumns(modelSnapshotTime: number): ColumnDef<Endpoint>[] {
  return [
    // === Basic Info ===
    {
      id: 'provider',
      header: ({ column }) => (
        <SortableHeader column={column} className="ml-1">
          Provider
        </SortableHeader>
      ),
      accessorFn: (row) => row.provider_name,
      cell: ({ row }) => {
        const isStale = row.original.snapshot_at < modelSnapshotTime
        return (
          <div className={cn('flex items-center gap-3 px-0.5', isStale && 'opacity-50')}>
            <ProviderBrandIcon slug={row.original.provider_slug} size={16} />
            <span className="font-medium">{row.original.provider_name}</span>

            {row.original.is_disabled && (
              <Badge variant="destructive" className="gap-1 text-[10px]">
                <OctagonXIcon className="size-3" />
                DISABLED
              </Badge>
            )}

            {row.original.status < 0 && <AlertTriangleIcon className="size-3.5 text-warning" />}
          </div>
        )
      },
    },

    {
      id: 'variant',
      header: ({ column }) => <SortableHeader column={column}>Variant</SortableHeader>,
      accessorFn: (row) => row.model_variant,
      cell: ({ row }) => {
        const variant = row.original.model_variant
        if (variant === 'standard') {
          return <span className="text-xs text-muted-foreground">standard</span>
        }
        return <Badge variant="default">{variant}</Badge>
      },
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.model_variant
        const b = rowB.original.model_variant
        if (a === b) return 0
        if (a === 'standard') return -1
        if (b === 'standard') return 1
        return a.localeCompare(b)
      },
    },

    {
      id: 'staleness',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Staleness
        </SortableHeader>
      ),
      accessorFn: (row) => row.staleness_hours,
      cell: ({ row }) => (
        <FormattedCell value={row.original.staleness_hours} className="text-right" />
      ),
    },

    // === Technical Specs ===
    {
      id: 'context_length',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Context (Ktok)
        </SortableHeader>
      ),
      accessorFn: (row) => row.context_length,
      cell: ({ row }) => (
        <FormattedCell value={row.original.context_length} className="text-right" />
      ),
    },

    {
      id: 'max_output',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Max Output (Ktok)
        </SortableHeader>
      ),
      accessorFn: (row) => row.limits.output_tokens ?? row.context_length,
      cell: ({ row }) => (
        <FormattedCell
          value={row.original.limits.output_tokens ?? row.original.context_length}
          className="text-right"
        />
      ),
    },

    {
      id: 'quantization',
      header: ({ column }) => <SortableHeader column={column}>Quant</SortableHeader>,
      accessorFn: (row) => row.quantization ?? '—',
      cell: ({ row }) => (
        <FormattedCell value={row.original.quantization ?? '—'} className="text-muted-foreground" />
      ),
    },

    // === Performance ===
    {
      id: 'throughput',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Throughput (tok/s)
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.stats?.p50_throughput),
      cell: ({ row }) => (
        <FormattedCell
          value={row.original.stats?.p50_throughput}
          className="text-right"
          decimals={1}
        />
      ),
      sortingFn: createNullSafeSortingFn((row) => row.stats?.p50_throughput),
    },

    {
      id: 'latency',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Latency (ms)
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.stats?.p50_latency),
      cell: ({ row }) => (
        <FormattedCell value={row.original.stats?.p50_latency} className="text-right" />
      ),
      sortingFn: createNullSafeSortingFn((row) => row.stats?.p50_latency),
    },

    {
      id: 'uptime',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Uptime (%)
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.uptime_average),
      cell: ({ row }) => {
        const uptime = row.original.uptime_average
        const formattedValue = uptime ? uptime.toFixed(1) : '—'
        return (
          <FormattedCell
            value={formattedValue}
            className={cn(
              uptime && uptime < 95 && 'text-warning',
              uptime && uptime < 90 && 'text-destructive',
              'text-right',
            )}
            decimals={1}
          />
        )
      },
    },

    {
      id: 'traffic_share',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Traffic (%)
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.traffic_share),
      cell: ({ row }) => {
        const traffic = row.original.traffic_share
        const value = traffic ? traffic * 100 : traffic
        return <FormattedCell value={value} className="text-right" decimals={1} />
      },
    },

    // === Pricing ===
    {
      id: 'input_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Input ($/Mtok)
        </SortableHeader>
      ),
      accessorFn: (row) => row.pricing.input ?? 0,
      cell: ({ row }) => (
        <FormattedCell value={formatPrice(row.original.pricing.input)} className="text-right" />
      ),
    },

    {
      id: 'output_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Output ($/Mtok)
        </SortableHeader>
      ),
      accessorFn: (row) => row.pricing.output ?? 0,
      cell: ({ row }) => (
        <FormattedCell value={formatPrice(row.original.pricing.output)} className="text-right" />
      ),
    },

    {
      id: 'cache_read_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Cache R ($/Mtok)
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.pricing.cache_read),
      cell: ({ row }) => (
        <FormattedCell
          value={
            row.original.pricing.cache_read ? formatPrice(row.original.pricing.cache_read) : '—'
          }
          className="text-right"
        />
      ),
    },

    {
      id: 'reasoning_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Reason ($/Mtok)
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.pricing.reasoning_output),
      cell: ({ row }) => (
        <FormattedCell
          value={
            row.original.pricing.reasoning_output
              ? formatPrice(row.original.pricing.reasoning_output)
              : '—'
          }
          className="text-right"
        />
      ),
    },

    // === Capabilities & Limits ===
    {
      id: 'capabilities',
      header: 'Capabilities',
      cell: ({ row }) => {
        const caps = row.original.capabilities
        return (
          <div className="flex gap-1">
            <CapabilityBadge enabled={caps.tools} label="tools" />
            <CapabilityBadge enabled={caps.reasoning} label="reason" />
            <CapabilityBadge enabled={caps.image_input} label="image" />
            <CapabilityBadge enabled={caps.file_input} label="pdf" />
          </div>
        )
      },
      enableSorting: false,
    },

    {
      id: 'rpm_limit',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          RPM
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.limits.rpm),
      cell: ({ row }) => <FormattedCell value={row.original.limits.rpm} className="text-right" />,
    },

    {
      id: 'rpd_limit',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          RPD
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.limits.rpd),
      cell: ({ row }) => <FormattedCell value={row.original.limits.rpd} className="text-right" />,
    },

    {
      id: 'data_policy',
      header: 'Data Policy',
      cell: ({ row }) => <DataPolicyIndicator policy={row.original.data_policy} />,
      enableSorting: false,
    },
  ]
}

// Default hidden columns - less commonly needed information
const DEFAULT_HIDDEN_COLUMNS: VisibilityState = {
  quantization: false,
  cache_read_price: false,
  reasoning_price: false,
  rpm_limit: false,
  rpd_limit: false,
  data_policy: false,
}

interface EndpointDataTableProps {
  model: Doc<'or_models'>
  endpoints: Endpoint[]
  dev?: boolean
}

export function EndpointDataTable({ model, endpoints, dev = true }: EndpointDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'traffic_share', desc: true }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    dev ? {} : DEFAULT_HIDDEN_COLUMNS,
  )

  const columns = useMemo(() => createColumns(model.snapshot_at), [model.snapshot_at])

  const table = useReactTable({
    data: endpoints,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnVisibility,
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
          <DropdownMenuContent align="end" className="w-[180px]">
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

      <Table className="border-t">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="text-xs has-[>button]:px-0">
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
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
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
