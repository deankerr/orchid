import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangleIcon, OctagonXIcon } from 'lucide-react'

import type { Endpoint } from '@/hooks/api'
import { cn } from '@/lib/utils'

import { BrandIcon } from '../brand-icon/brand-icon'
import { Badge } from '../ui/badge'
import {
  CapabilityBadge,
  createNullSafeSortingFn,
  DataPolicyIndicator,
  formatPriceToK,
  formatPriceToM,
  FormattedCell,
  SortableHeader,
} from './table-components'

export const endpointColumns: ColumnDef<Endpoint>[] = [
  // === Basic Info ===
  {
    id: 'provider',
    header: ({ column }) => (
      <SortableHeader column={column} className="ml-1">
        provider
      </SortableHeader>
    ),
    accessorFn: (row) => row.provider_name,
    cell: ({ row }) => {
      const endpoint = row.original
      return (
        <div className={cn('flex items-center gap-3 px-0.5')}>
          <BrandIcon slug={endpoint.provider_slug} size={16} />
          <span className="font-medium">{endpoint.provider_name}</span>

          {endpoint.is_disabled && (
            <Badge variant="destructive" className="gap-1 text-[10px]">
              <OctagonXIcon className="size-3" />
              DISABLED
            </Badge>
          )}

          {endpoint.status < 0 && <AlertTriangleIcon className="size-3.5 text-warning" />}
        </div>
      )
    },
    enableHiding: false,
  },

  {
    id: 'staleness',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        staleness
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
        context
      </SortableHeader>
    ),
    accessorFn: (row) => row.context_length,
    cell: ({ row }) => (
      <FormattedCell value={row.original.context_length} className="text-right" suffix="tok" />
    ),
  },

  {
    id: 'max_input',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        max input
      </SortableHeader>
    ),
    accessorFn: (row) => row.limits.input_tokens,
    cell: ({ row }) => (
      <FormattedCell value={row.original.limits.input_tokens} className="text-right" suffix="tok" />
    ),
  },

  {
    id: 'max_output',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        max output
      </SortableHeader>
    ),
    accessorFn: (row) => row.limits.output_tokens,
    cell: ({ row }) => (
      <FormattedCell
        value={row.original.limits.output_tokens ?? row.original.context_length}
        className="text-right"
        suffix="tok"
      />
    ),
  },

  {
    id: 'quantization',
    header: ({ column }) => <SortableHeader column={column}>quant</SortableHeader>,
    accessorFn: (row) => row.quantization,
    cell: ({ row }) => <FormattedCell value={row.original.quantization} />,
  },

  // === Performance ===
  {
    id: 'throughput',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        throughput
      </SortableHeader>
    ),
    accessorFn: (row) => row.stats?.p50_throughput,
    cell: ({ row }) => (
      <FormattedCell
        value={row.original.stats?.p50_throughput}
        className="text-right"
        decimals={1}
        suffix="tok/s"
      />
    ),
    sortingFn: createNullSafeSortingFn((row) => row.stats?.p50_throughput),
  },

  {
    id: 'latency',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        latency
      </SortableHeader>
    ),
    accessorFn: (row) => row.stats?.p50_latency,
    cell: ({ row }) => (
      <FormattedCell value={row.original.stats?.p50_latency} className="text-right" suffix="ms" />
    ),
    sortingFn: createNullSafeSortingFn((row) => row.stats?.p50_latency),
  },

  {
    id: 'uptime',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        uptime
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
          suffix="%"
        />
      )
    },
  },

  // === Pricing ===
  {
    id: 'input_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        input
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.input ?? 0,
    cell: ({ row }) => (
      <FormattedCell
        value={formatPriceToM(row.original.pricing.input)}
        className="text-right"
        prefix="$"
        suffix="Mtok"
      />
    ),
  },

  {
    id: 'output_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        output
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.output ?? 0,
    cell: ({ row }) => (
      <FormattedCell
        value={formatPriceToM(row.original.pricing.output)}
        className="text-right"
        prefix="$"
        suffix="Mtok"
      />
    ),
  },

  {
    id: 'reasoning_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        reasoning
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.reasoning_output,
    cell: ({ row }) => (
      <FormattedCell
        value={formatPriceToM(row.original.pricing.reasoning_output)}
        className="text-right"
        prefix="$"
        suffix="Mtok"
      />
    ),
  },

  {
    id: 'image_input_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        image
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.image_input,
    cell: ({ row }) => (
      <FormattedCell
        value={formatPriceToK(row.original.pricing.image_input)}
        className="text-right"
        prefix="$"
        suffix="Ktok"
      />
    ),
  },

  {
    id: 'cache_read_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        cache read
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.cache_read,
    cell: ({ row }) => (
      <FormattedCell
        value={formatPriceToM(row.original.pricing.cache_read)}
        className="text-right"
        prefix="$"
        suffix="Mtok"
      />
    ),
  },

  {
    id: 'cache_write_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        cache write
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.cache_write,
    cell: ({ row }) => (
      <FormattedCell
        value={formatPriceToM(row.original.pricing.cache_write)}
        className="text-right"
        prefix="$"
        suffix="Mtok"
      />
    ),
  },

  {
    id: 'web_search_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        web search
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.web_search,
    cell: ({ row }) => (
      <FormattedCell
        value={row.original.pricing.web_search}
        className="text-right"
        decimals={6}
        prefix="$"
      />
    ),
  },

  {
    id: 'per_request_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        per request
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.per_request,
    cell: ({ row }) => (
      <FormattedCell
        value={row.original.pricing.per_request}
        className="text-right"
        decimals={6}
        prefix="$"
      />
    ),
  },

  // === Capabilities & Limits ===
  {
    id: 'capabilities',
    header: ({ column }) => <SortableHeader column={column}>capabilities</SortableHeader>,
    cell: ({ row }) => {
      const caps = row.original.capabilities
      return (
        <div className="flex gap-1">
          <CapabilityBadge enabled={caps.byok} label="byok" />
          <CapabilityBadge enabled={caps.chat_completions} label="chat" />
          <CapabilityBadge enabled={caps.completions} label="completions" />
          <CapabilityBadge enabled={caps.multipart_messages} label="multipart" />
          <CapabilityBadge enabled={caps.stream_cancellation} label="cancel" />
          <CapabilityBadge enabled={caps.tools} label="tools" />
        </div>
      )
    },
    enableSorting: false,
  },

  {
    id: 'rpm_limit',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        requests/min
      </SortableHeader>
    ),
    accessorFn: (row) => row.limits.rpm,
    cell: ({ row }) => (
      <FormattedCell value={row.original.limits.rpm} className="text-right" suffix="req/min" />
    ),
  },

  {
    id: 'rpd_limit',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        requests/day
      </SortableHeader>
    ),
    accessorFn: (row) => row.limits.rpd,
    cell: ({ row }) => (
      <FormattedCell value={row.original.limits.rpd} className="text-right" suffix="req/day" />
    ),
  },

  {
    id: 'images_per_prompt',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        images/prompt
      </SortableHeader>
    ),
    accessorFn: (row) => row.limits.images_per_prompt,
    cell: ({ row }) => (
      <FormattedCell
        value={row.original.limits.images_per_prompt}
        className="text-right"
        suffix="img"
      />
    ),
  },

  {
    id: 'tokens_per_image',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        tokens/image
      </SortableHeader>
    ),
    accessorFn: (row) => row.limits.tokens_per_image,
    cell: ({ row }) => (
      <FormattedCell
        value={row.original.limits.tokens_per_image}
        className="text-right"
        suffix="tok"
      />
    ),
  },

  {
    id: 'data_policy',
    header: ({ column }) => <SortableHeader column={column}>data policy</SortableHeader>,
    cell: ({ row }) => <DataPolicyIndicator policy={row.original.data_policy} />,
    enableSorting: false,
  },

  {
    id: 'is_moderated',
    header: ({ column }) => <SortableHeader column={column}>moderated</SortableHeader>,
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

  {
    id: 'traffic',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        traffic
      </SortableHeader>
    ),
    accessorFn: (row) => row.traffic_share,
    cell: ({ row }) => {
      const traffic = row.original.traffic_share
      const value = traffic ? traffic * 100 : traffic
      return <FormattedCell value={value} className="text-right" decimals={1} suffix="%" />
    },
    sortingFn: createNullSafeSortingFn((row) => row.traffic_share),
  },
]
