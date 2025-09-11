'use client'

import { useMemo } from 'react'

import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import type { Doc } from '@/convex/_generated/dataModel'

import { Badge } from '@/components/ui/badge'
import { DataGrid } from '@/components/ui/data-grid'
import { DataGridTable } from '@/components/ui/data-grid-table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/formatters'

import { DataGridAttributeBadge, getEndpointAttributes } from './attributes'
import { EntityCard } from './entity-card'
import { ModalityIcons } from './modalities'

type EndpointRow = Doc<'or_views_endpoints'>

export function EndpointsDataGrid({
  endpoints,
  isLoading = false,
}: {
  endpoints: EndpointRow[]
  isLoading?: boolean
}) {
  const columns = useMemo<ColumnDef<EndpointRow>[]>(
    () => [
      {
        id: 'model',
        header: 'Model',
        cell: ({ row }) => {
          const endpoint = row.original
          return (
            <EntityCard
              className="w-60"
              icon_url={endpoint.model.icon_url}
              name={endpoint.model.name}
              slug={endpoint.model.slug}
            />
          )
        },
        size: 272,
        meta: {
          skeleton: <Skeleton className="h-12 w-full" />,
        },
      },

      {
        id: 'provider',
        header: 'Provider',
        cell: ({ row }) => {
          const endpoint = row.original
          return (
            <EntityCard
              className="w-44"
              icon_url={endpoint.provider.icon_url}
              name={endpoint.provider.name}
              slug={endpoint.provider.slug}
            />
          )
        },
        size: 218,
        meta: {
          skeleton: <Skeleton className="h-12 w-full" />,
        },
      },

      {
        id: 'variant',
        header: 'Variant',
        cell: ({ row }) => {
          const variant = row.original.model.variant

          if (variant === 'standard') {
            return <EmptyCell />
          }

          return (
            <Badge variant="outline" className="font-mono">
              {variant}
            </Badge>
          )
        },
        size: 112,
        meta: {
          headerClassName: 'text-center',
          skeleton: <Skeleton className="h-6 w-full" />,
          cellClassName: 'text-center',
        },
      },

      {
        id: 'inputModalities',
        header: 'Input Modalities',
        cell: ({ row }) => {
          const endpoint = row.original

          return (
            <ModalityIcons
              className="min-w-16 gap-px"
              modalities={endpoint.model.input_modalities}
            />
          )
        },
        size: 114,
        meta: {
          skeleton: <Skeleton className="h-6 w-full" />,
        },
      },

      {
        id: 'outputModalities',
        header: 'Output Modalities',
        cell: ({ row }) => {
          const endpoint = row.original

          return (
            <ModalityIcons className="min-w-16" modalities={endpoint.model.output_modalities} />
          )
        },
        size: 112,
        meta: {
          skeleton: <Skeleton className="h-6 w-full" />,
        },
      },

      {
        id: 'contextLength',
        header: 'Context Length',
        cell: ({ row }) => {
          const contextLength = row.original.context_length
          return <div className="font-mono text-sm">{formatNumber(contextLength, 0)}</div>
        },
        size: 140,
        meta: {
          skeleton: <Skeleton className="h-4 w-full" />,
          headerClassName: 'text-center',
          cellClassName: 'text-right',
        },
      },

      {
        id: 'maxOutput',
        header: 'Max Output',
        cell: ({ row }) => {
          const maxOutput = row.original.limits.text_output_tokens
          if (!maxOutput) {
            return <EmptyCell />
          }
          return <div className="font-mono text-sm">{formatNumber(maxOutput, 0)}</div>
        },
        size: 112,
        meta: {
          skeleton: <Skeleton className="h-4 w-full" />,
          headerClassName: 'text-center',
          cellClassName: 'text-right',
        },
      },

      {
        id: 'quantization',
        header: 'Quant.',
        cell: ({ row }) => {
          const quantization = row.original.quantization
          return (
            <Badge variant="outline" className="font-mono text-sm uppercase">
              {!quantization || quantization === 'unknown' ? '?' : quantization}
            </Badge>
          )
        },
        size: 96,
        meta: {
          skeleton: <Skeleton className="h-6 w-full" />,
          headerClassName: 'text-center',
          cellClassName: 'text-center',
        },
      },

      {
        id: 'inputPrice',
        header: 'Input $ per MTOK',
        cell: ({ row }) => {
          const inputPrice = row.original.pricing.text_input
          if (!inputPrice) {
            return <EmptyCell />
          }
          return <div className="font-mono">${formatNumber(inputPrice * 1_000_000, 2)}</div>
        },
        size: 96,
        meta: {
          skeleton: <Skeleton className="h-4 w-full" />,
          headerClassName: 'text-center',
          cellClassName: 'text-right',
        },
      },

      {
        id: 'outputPrice',
        header: 'Output $ per MTOK',
        cell: ({ row }) => {
          const outputPrice = row.original.pricing.text_output
          if (!outputPrice) {
            return <EmptyCell />
          }
          return <div className="font-mono">${formatNumber(outputPrice * 1_000_000, 2)}</div>
        },
        size: 96,
        meta: {
          skeleton: <Skeleton className="h-4 w-full" />,
          headerClassName: 'text-center',
          cellClassName: 'text-right',
        },
      },

      {
        id: 'miscPricing',
        header: 'Misc $',
        cell: ({ row }) => {
          const pricing = row.original.pricing
          const otherPrices = []

          if (pricing.internal_reasoning) {
            otherPrices.push({
              label: 'reasoning:',
              value: `$${formatNumber(pricing.internal_reasoning * 1_000_000, 2)}/MTOK`,
            })
          }
          if (pricing.image_input) {
            otherPrices.push({
              label: 'images_input:',
              value: `$${formatNumber(pricing.image_input * 1_000, 2)}/K IMAGES`,
            })
          }
          if (pricing.image_output) {
            otherPrices.push({
              label: 'images_output:',
              value: `$${formatNumber(pricing.image_output * 1_000, 2)}/K IMAGES`,
            })
          }
          if (pricing.audio_input) {
            otherPrices.push({
              label: 'audio_input:',
              value: `$${formatNumber(pricing.audio_input * 1_000_000, 2)}/MTOK`,
            })
          }
          if (pricing.audio_cache_input) {
            otherPrices.push({
              label: 'audio_cache_input:',
              value: `$${formatNumber(pricing.audio_cache_input * 1_000_000, 2)}/MTOK`,
            })
          }
          if (pricing.cache_read) {
            otherPrices.push({
              label: 'cache_read:',
              value: `$${formatNumber(pricing.cache_read * 1_000_000, 2)}/MTOK`,
            })
          }
          if (pricing.cache_write) {
            otherPrices.push({
              label: 'cache_write:',
              value: `$${formatNumber(pricing.cache_write * 1_000_000, 2)}/MTOK`,
            })
          }
          if (pricing.request) {
            otherPrices.push({
              label: 'per_request:',
              value: `$${formatNumber(pricing.request, 2)}`,
            })
          }
          if (pricing.web_search) {
            otherPrices.push({
              label: 'web_search:',
              value: `$${formatNumber(pricing.web_search, 2)}`,
            })
          }
          if (pricing.discount && pricing.discount > 0) {
            otherPrices.push({
              label: 'discount:',
              value: `${formatNumber(pricing.discount * 100, 1)}%`,
            })
          }

          if (otherPrices.length === 0) {
            return <EmptyCell />
          }

          return (
            <div className="space-y-1 font-mono text-xs">
              {otherPrices.map((price, idx) => (
                <div key={idx}>
                  <div>{price.label}</div>
                  <div>{price.value}</div>
                </div>
              ))}
            </div>
          )
        },
        size: 160,
        meta: {
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'limits',
        header: 'Limits',
        cell: ({ row }) => {
          const limits = row.original.limits
          const limitsList = []

          if (limits.text_input_tokens) {
            limitsList.push({
              label: 'max_input:',
              value: `${formatNumber(limits.text_input_tokens, 0)}`,
            })
          }
          if (limits.image_input_tokens) {
            limitsList.push({
              label: 'max_image_tokens:',
              value: `${formatNumber(limits.image_input_tokens, 0)}`,
            })
          }
          if (limits.images_per_input) {
            limitsList.push({
              label: 'images_per_input:',
              value: `${limits.images_per_input}`,
            })
          }
          if (limits.requests_per_minute) {
            limitsList.push({
              label: 'req_per_min:',
              value: `${formatNumber(limits.requests_per_minute, 0)}`,
            })
          }
          if (limits.requests_per_day) {
            limitsList.push({
              label: 'req_per_day:',
              value: `${formatNumber(limits.requests_per_day, 0)}`,
            })
          }

          if (limitsList.length === 0) {
            return <EmptyCell />
          }

          return (
            <div className="space-y-1 font-mono text-xs">
              {limitsList.map((limit, idx) => (
                <div key={idx}>
                  <div>{limit.label}</div>
                  <div>{limit.value}</div>
                </div>
              ))}
            </div>
          )
        },
        size: 160,
        meta: {
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'attributes',
        header: 'Attributes',
        cell: ({ row }) => {
          const endpoint = row.original
          const attributes = getEndpointAttributes(endpoint).filter(
            (attr) =>
              ![
                'completions',
                'chat_completions',
                'stream_cancellation',
                'cache_pricing',
                'implicit_caching',
                'free',
                'mandatory_reasoning',
              ].includes(attr.key),
          )

          return (
            <div className="flex w-64 flex-wrap gap-1">
              {attributes.map((attribute) => (
                <DataGridAttributeBadge
                  key={attribute.key}
                  icon={attribute.icon}
                  label={attribute.label}
                  variant={attribute.variant}
                />
              ))}
            </div>
          )
        },
        size: 288,
        meta: {
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },
    ],
    [],
  )

  const table = useReactTable({
    data: endpoints,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <DataGrid
      table={table}
      recordCount={endpoints.length}
      isLoading={isLoading}
      loadingMessage="Loading endpoints..."
      emptyMessage="No endpoints found"
      tableLayout={{
        headerSticky: true,
        width: 'fixed',
        cellBorder: false,
      }}
      tableClassNames={{
        headerRow: 'font-mono uppercase text-[85%]',
      }}
    >
      <DataGridTable />
    </DataGrid>
  )
}

function EmptyCell() {
  return <div className="text-muted-foreground/60">—</div>
}
