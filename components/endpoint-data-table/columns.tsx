import * as R from 'remeda'

import type { ColumnDef } from '@tanstack/react-table'

import type { Endpoint } from '@/hooks/api'
import { cn } from '@/lib/utils'

import { AttributeBadge } from '../attributes'
import { BrandIcon } from '../brand-icon/brand-icon'
import { EndpointDerankedBadge } from '../shared/endpoint-deranked-badge'
import { ModelVariantBadge } from '../shared/model-variant-badge'
import { NumericValue, PricingProperty } from '../shared/numeric-value'
import { createNullSafeSortingFn, SortableHeader } from './table-components'

export const endpointColumns: ColumnDef<Endpoint>[] = [
  // === Basic Info ===
  {
    id: 'provider',
    header: ({ column }) => <SortableHeader column={column}>provider</SortableHeader>,
    accessorFn: (row) => row.provider_name,
    cell: ({ row }) => {
      const endpoint = row.original
      return (
        <div className={cn('flex items-center gap-3 px-0.5 font-sans font-medium')}>
          <BrandIcon url={endpoint.icon_url} size={16} />
          <span>{endpoint.provider_name}</span>
          <ModelVariantBadge modelVariant={endpoint.model_variant} />

          {endpoint.is_disabled && <AttributeBadge attribute="isDisabled" />}

          {endpoint.status < 0 && <EndpointDerankedBadge />}
        </div>
      )
    },
    enableHiding: false,
  },

  {
    id: 'capabilities',
    header: ({ column }) => (
      <SortableHeader column={column} align="center">
        capabilities
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const caps = row.original.capabilities
      const params = row.original.supported_parameters
      return (
        <div className="flex gap-1">
          <AttributeBadge attribute="tools" className={cn(!caps.tools && 'opacity-30')} />
          <AttributeBadge
            attribute="jsonObject"
            className={cn(!params.includes('response_format') && 'opacity-30')}
          />
          <AttributeBadge
            attribute="structuredOutputs"
            className={cn(!params.includes('structured_outputs') && 'opacity-30')}
          />
        </div>
      )
    },
  },

  {
    id: 'quantization',
    header: ({ column }) => (
      <SortableHeader column={column} align="center">
        quant
      </SortableHeader>
    ),
    accessorFn: (row) => row.quantization,
    cell: ({ row }) => (
      <div className="text-center">{row.original.quantization?.toUpperCase() ?? '?'}</div>
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
    cell: ({ row }) => <NumericValue value={row.original.context_length} unit="TOK" />,
  },

  {
    id: 'max_input',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        max input
      </SortableHeader>
    ),
    accessorFn: (row) => row.limits.input_tokens,
    cell: ({ row }) => <NumericValue value={row.original.limits.input_tokens} unit="TOK" />,
  },

  {
    id: 'max_output',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        max output
      </SortableHeader>
    ),
    accessorFn: (row) => row.limits.output_tokens,
    cell: ({ row }) => <NumericValue value={row.original.limits.output_tokens} unit="TOK" />,
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
    cell: ({ row }) => <NumericValue value={row.original.stats?.p50_throughput} unit="TOK/S" />,
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
      <NumericValue
        value={row.original.stats?.p50_latency}
        transform={(value) => value / 1000}
        digits={2}
        unit="S"
      />
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
      const textColor =
        R.isDefined(uptime) &&
        (uptime >= 99 ? '' : uptime >= 85 ? 'text-warning' : 'text-destructive')
      return <NumericValue value={uptime} unit="%" digits={1} className={cn(textColor)} />
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
    cell: ({ row }) => <PricingProperty pricing={row.original.pricing} field="input" />,
  },

  {
    id: 'output_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        output
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.output ?? 0,
    cell: ({ row }) => <PricingProperty pricing={row.original.pricing} field="output" />,
  },

  {
    id: 'reasoning_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        reasoning
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.reasoning_output,
    cell: ({ row }) => <PricingProperty pricing={row.original.pricing} field="reasoning_output" />,
  },

  {
    id: 'image_input_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        image
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.image_input,
    cell: ({ row }) => <PricingProperty pricing={row.original.pricing} field="image_input" />,
  },

  {
    id: 'cache_read_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        cache read
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.cache_read,
    cell: ({ row }) => <PricingProperty pricing={row.original.pricing} field="cache_read" />,
  },

  {
    id: 'cache_write_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        cache write
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.cache_write,
    cell: ({ row }) => <PricingProperty pricing={row.original.pricing} field="cache_write" />,
  },

  {
    id: 'web_search_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        web search
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.web_search,
    cell: ({ row }) => <PricingProperty pricing={row.original.pricing} field="web_search" />,
  },

  {
    id: 'per_request_price',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        per request
      </SortableHeader>
    ),
    accessorFn: (row) => row.pricing.per_request,
    cell: ({ row }) => <PricingProperty pricing={row.original.pricing} field="per_request" />,
  },

  // === Limits ===

  {
    id: 'rpm_limit',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        requests/min
      </SortableHeader>
    ),
    accessorFn: (row) => row.limits.rpm,
    cell: ({ row }) => <NumericValue value={row.original.limits.rpm} unit="" />,
  },

  {
    id: 'rpd_limit',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        requests/day
      </SortableHeader>
    ),
    accessorFn: (row) => row.limits.rpd,
    cell: ({ row }) => <NumericValue value={row.original.limits.rpd} unit="" />,
  },

  {
    id: 'images_per_prompt',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        images/prompt
      </SortableHeader>
    ),
    accessorFn: (row) => row.limits.images_per_prompt,
    cell: ({ row }) => <NumericValue value={row.original.limits.images_per_prompt} unit="" />,
  },

  {
    id: 'tokens_per_image',
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        tokens/image
      </SortableHeader>
    ),
    accessorFn: (row) => row.limits.tokens_per_image,
    cell: ({ row }) => <NumericValue value={row.original.limits.tokens_per_image} unit="TOK" />,
  },

  {
    id: 'data_policy',
    header: ({ column }) => (
      <SortableHeader column={column} align="center">
        data policy
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex gap-1">
        {row.original.data_policy.training && <AttributeBadge attribute="trainsOnData" />}
        {row.original.data_policy.can_publish && <AttributeBadge attribute="canPublish" />}
      </div>
    ),
  },

  {
    id: 'is_moderated',
    header: ({ column }) => (
      <SortableHeader column={column} align="center">
        moderated
      </SortableHeader>
    ),
    accessorFn: (row) => row.is_moderated,
    cell: ({ row }) => {
      if (!row.original.is_moderated) return null
      return <AttributeBadge attribute="isModerated" />
    },
  },
]
