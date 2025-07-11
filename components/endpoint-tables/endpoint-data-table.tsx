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
import {
  cn,
  formatLatency,
  formatPercentage,
  formatRateLimit,
  formatThroughput,
  formatTokenLimit,
  formatTokenPrice,
} from '@/lib/utils'

import {
  createNullSafeAccessor,
  createNullSafeSortingFn,
  FormattedCell,
  SortableHeader,
} from './table-components'

type EndpointWithTraffic = Doc<'or_endpoints'> & {
  traffic?: number
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

// Column group factories
function createBasicInfoColumns(modelSnapshotTime: number): ColumnDef<EndpointWithTraffic>[] {
  return [
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
  ]
}

function createTechnicalColumns(): ColumnDef<EndpointWithTraffic>[] {
  return [
    {
      id: 'context_length',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Context
        </SortableHeader>
      ),
      accessorFn: (row) => row.context_length,
      cell: ({ row }) => (
        <FormattedCell
          value={formatTokenLimit(row.original.context_length)}
          className="text-right"
        />
      ),
    },
    {
      id: 'max_output',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Max Output
        </SortableHeader>
      ),
      accessorFn: (row) => row.limits.output_tokens ?? row.context_length,
      cell: ({ row }) => (
        <FormattedCell
          value={formatTokenLimit(row.original.limits.output_tokens ?? row.original.context_length)}
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
  ]
}

function createPerformanceColumns(): ColumnDef<EndpointWithTraffic>[] {
  return [
    {
      id: 'throughput',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Throughput
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.stats?.p50_throughput),
      cell: ({ row }) => (
        <FormattedCell
          value={formatThroughput(row.original.stats?.p50_throughput)}
          unit="tok/s"
          className="text-right"
        />
      ),
      sortingFn: createNullSafeSortingFn((row) => row.stats?.p50_throughput),
    },
    {
      id: 'latency',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Latency
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.stats?.p50_latency),
      cell: ({ row }) => (
        <FormattedCell
          value={formatLatency(row.original.stats?.p50_latency)}
          className="text-right"
        />
      ),
      sortingFn: createNullSafeSortingFn((row) => row.stats?.p50_latency),
    },
    {
      id: 'uptime',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Uptime
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.uptime_average),
      cell: ({ row }) => {
        const uptime = row.original.uptime_average
        return (
          <FormattedCell
            value={formatPercentage(uptime)}
            className={cn(
              uptime && uptime < 95 && 'text-warning',
              uptime && uptime < 90 && 'text-destructive',
              'text-right',
            )}
          />
        )
      },
    },
    {
      id: 'traffic',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Traffic
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.traffic),
      cell: ({ row }) => (
        <FormattedCell value={formatPercentage(row.original.traffic)} className="text-right" />
      ),
    },
  ]
}

function createPricingColumns(): ColumnDef<EndpointWithTraffic>[] {
  return [
    {
      id: 'input_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          $/M In
        </SortableHeader>
      ),
      accessorFn: (row) => row.pricing.input ?? 0,
      cell: ({ row }) => (
        <FormattedCell
          value={formatTokenPrice(row.original.pricing.input)}
          prefix="$"
          className="text-right"
        />
      ),
    },
    {
      id: 'output_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          $/M Out
        </SortableHeader>
      ),
      accessorFn: (row) => row.pricing.output ?? 0,
      cell: ({ row }) => (
        <FormattedCell
          value={formatTokenPrice(row.original.pricing.output)}
          prefix="$"
          className="text-right"
        />
      ),
    },
    {
      id: 'cache_read_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Cache R
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.pricing.cache_read),
      cell: ({ row }) => (
        <FormattedCell
          value={
            row.original.pricing.cache_read
              ? formatTokenPrice(row.original.pricing.cache_read)
              : '—'
          }
          prefix={row.original.pricing.cache_read ? '$' : ''}
          className="text-right"
        />
      ),
    },
    {
      id: 'reasoning_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Reason
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.pricing.reasoning_output),
      cell: ({ row }) => (
        <FormattedCell
          value={
            row.original.pricing.reasoning_output
              ? formatTokenPrice(row.original.pricing.reasoning_output)
              : '—'
          }
          prefix={row.original.pricing.reasoning_output ? '$' : ''}
          className="text-right"
        />
      ),
    },
  ]
}

function createMiscColumns(): ColumnDef<EndpointWithTraffic>[] {
  return [
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
      cell: ({ row }) => (
        <FormattedCell value={formatRateLimit(row.original.limits.rpm)} className="text-right" />
      ),
    },
    {
      id: 'rpd_limit',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          RPD
        </SortableHeader>
      ),
      accessorFn: createNullSafeAccessor((row) => row.limits.rpd),
      cell: ({ row }) => (
        <FormattedCell value={formatRateLimit(row.original.limits.rpd)} className="text-right" />
      ),
    },
    {
      id: 'data_policy',
      header: 'Data Policy',
      cell: ({ row }) => <DataPolicyIndicator policy={row.original.data_policy} />,
      enableSorting: false,
    },
  ]
}

// Main column definition
export function createColumns(modelSnapshotTime: number): ColumnDef<EndpointWithTraffic>[] {
  return [
    ...createBasicInfoColumns(modelSnapshotTime),
    ...createTechnicalColumns(),
    ...createPerformanceColumns(),
    ...createPricingColumns(),
    ...createMiscColumns(),
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
  endpoints: Doc<'or_endpoints'>[]
}

export function EndpointDataTable({ model, endpoints }: EndpointDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'traffic', desc: true }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({}) // NOTE: show all during development

  // Calculate traffic percentages
  const endpointsWithTraffic = useMemo(() => {
    const totalRequests = endpoints.reduce((sum, ep) => sum + (ep.stats?.request_count ?? 0), 0)
    return endpoints.map((ep) => ({
      ...ep,
      traffic:
        totalRequests > 0 ? ((ep.stats?.request_count ?? 0) / totalRequests) * 100 : undefined,
    }))
  }, [endpoints])

  const columns = useMemo(() => createColumns(model.snapshot_at), [model.snapshot_at])

  const table = useReactTable({
    data: endpointsWithTraffic,
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
