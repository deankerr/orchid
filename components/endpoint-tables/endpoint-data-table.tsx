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

import { createNullSafeSortingFn, FormattedCell, SortableHeader } from './table-components'

// Price formatting utility
function formatPriceToM(value: number | null | undefined) {
  if (typeof value === 'number') {
    return (value * 1_000_000).toFixed(2)
  }
}

function formatPriceToK(value: number | null | undefined) {
  if (typeof value === 'number') {
    return (value * 1_000).toFixed(2)
  }
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

export function createColumns(): ColumnDef<Endpoint>[] {
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
        return (
          <div className={cn('flex items-center gap-3 px-0.5')}>
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
          Context (tok)
        </SortableHeader>
      ),
      accessorFn: (row) => row.context_length,
      cell: ({ row }) => (
        <FormattedCell value={row.original.context_length} className="text-right" />
      ),
    },

    {
      id: 'max_input',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Max Input (tok)
        </SortableHeader>
      ),
      accessorFn: (row) => row.limits.input_tokens,
      cell: ({ row }) => (
        <FormattedCell value={row.original.limits.input_tokens} className="text-right" />
      ),
    },

    {
      id: 'max_output',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Max Output (tok)
        </SortableHeader>
      ),
      accessorFn: (row) => row.limits.output_tokens,
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
      accessorFn: (row) => row.quantization,
      cell: ({ row }) => <FormattedCell value={row.original.quantization} />,
    },

    // === Performance ===
    {
      id: 'throughput',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Throughput (tok/s)
        </SortableHeader>
      ),
      accessorFn: (row) => row.stats?.p50_throughput,
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
      accessorFn: (row) => row.stats?.p50_latency,
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
      accessorFn: (row) => row.uptime_average,
      cell: ({ row }) => {
        const uptime = row.original.uptime_average
        return (
          <FormattedCell
            value={uptime}
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
      accessorFn: (row) => row.traffic_share,
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
        <FormattedCell value={formatPriceToM(row.original.pricing.input)} className="text-right" />
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
        <FormattedCell value={formatPriceToM(row.original.pricing.output)} className="text-right" />
      ),
    },

    {
      id: 'reasoning_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Reasoning ($/Mtok)
        </SortableHeader>
      ),
      accessorFn: (row) => row.pricing.reasoning_output,
      cell: ({ row }) => (
        <FormattedCell
          value={formatPriceToM(row.original.pricing.reasoning_output)}
          className="text-right"
        />
      ),
    },

    {
      id: 'image_input_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Image ($/ktok)
        </SortableHeader>
      ),
      accessorFn: (row) => row.pricing.image_input,
      cell: ({ row }) => (
        <FormattedCell
          value={formatPriceToK(row.original.pricing.image_input)}
          className="text-right"
        />
      ),
    },

    {
      id: 'cache_read_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Cache Read ($/Mtok)
        </SortableHeader>
      ),
      accessorFn: (row) => row.pricing.cache_read,
      cell: ({ row }) => (
        <FormattedCell
          value={formatPriceToM(row.original.pricing.cache_read)}
          className="text-right"
        />
      ),
    },

    {
      id: 'cache_write_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Cache Write ($/Mtok)
        </SortableHeader>
      ),
      accessorFn: (row) => row.pricing.cache_write,
      cell: ({ row }) => (
        <FormattedCell
          value={formatPriceToM(row.original.pricing.cache_write)}
          className="text-right"
        />
      ),
    },

    {
      id: 'web_search_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Web Search ($)
        </SortableHeader>
      ),
      accessorFn: (row) => row.pricing.web_search,
      cell: ({ row }) => (
        <FormattedCell
          value={row.original.pricing.web_search}
          className="text-right"
          decimals={6}
        />
      ),
    },

    {
      id: 'per_request_price',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Per Request ($)
        </SortableHeader>
      ),
      accessorFn: (row) => row.pricing.per_request,
      cell: ({ row }) => (
        <FormattedCell
          value={row.original.pricing.per_request}
          className="text-right"
          decimals={6}
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
          Requests/Min
        </SortableHeader>
      ),
      accessorFn: (row) => row.limits.rpm,
      cell: ({ row }) => <FormattedCell value={row.original.limits.rpm} className="text-right" />,
    },

    {
      id: 'rpd_limit',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Requests/Day
        </SortableHeader>
      ),
      accessorFn: (row) => row.limits.rpd,
      cell: ({ row }) => <FormattedCell value={row.original.limits.rpd} className="text-right" />,
    },

    {
      id: 'images_per_prompt',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Images/Prompt
        </SortableHeader>
      ),
      accessorFn: (row) => row.limits.images_per_prompt,
      cell: ({ row }) => (
        <FormattedCell value={row.original.limits.images_per_prompt} className="text-right" />
      ),
    },

    {
      id: 'tokens_per_image',
      header: ({ column }) => (
        <SortableHeader column={column} align="right">
          Tokens/Image
        </SortableHeader>
      ),
      accessorFn: (row) => row.limits.tokens_per_image,
      cell: ({ row }) => (
        <FormattedCell value={row.original.limits.tokens_per_image} className="text-right" />
      ),
    },

    {
      id: 'data_policy',
      header: 'Data Policy',
      cell: ({ row }) => <DataPolicyIndicator policy={row.original.data_policy} />,
      enableSorting: false,
    },

    {
      id: 'is_moderated',
      header: 'Moderated',
      accessorFn: (row) => row.is_moderated,
      cell: ({ row }) => {
        if (!row.original.is_moderated) return null
        return (
          <Badge variant="outline" className="gap-1 text-[10px] text-warning">
            <AlertTriangleIcon className="size-3" />
            moderated
          </Badge>
        )
      },
    },
  ]
}

// Default hidden columns - less commonly needed information
const DEFAULT_HIDDEN_COLUMNS: VisibilityState = {
  quantization: false,
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
  dev?: boolean
}

export function EndpointDataTable({ model, endpoints, dev = true }: EndpointDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'traffic_share', desc: true }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    dev ? {} : DEFAULT_HIDDEN_COLUMNS,
  )

  const columns = useMemo(() => createColumns(), [])

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
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={cn(
                  'border-b-transparent',
                  row.original.staleness_hours > 6 && 'opacity-50',
                )}
              >
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
