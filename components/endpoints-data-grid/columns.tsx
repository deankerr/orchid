import { useMemo } from 'react'

import { ColumnDef } from '@tanstack/react-table'

import type { Doc } from '@/convex/_generated/dataModel'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/formatters'

import { EntityCard } from '../shared/entity-card'
import { DataGridAttributeBadge, getEndpointAttributes } from './attributes'
import { ModalityIcons } from './modalities'

export type EndpointRow = Doc<'or_views_endpoints'>

export function useEndpointsColumns(): ColumnDef<EndpointRow>[] {
  return useMemo<ColumnDef<EndpointRow>[]>(
    () => [
      {
        id: 'model',
        header: 'Model',
        cell: ({ row }) => {
          const endpoint = row.original
          return (
            <EntityCard
              icon_url={endpoint.model.icon_url}
              name={endpoint.model.name}
              slug={endpoint.model.slug}
            />
          )
        },
        size: 290,
        meta: {
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'provider',
        header: 'Provider',
        cell: ({ row }) => {
          const endpoint = row.original
          return (
            <EntityCard
              icon_url={endpoint.provider.icon_url}
              name={endpoint.provider.name}
              slug={endpoint.provider.tag_slug}
            />
          )
        },
        size: 225,
        meta: {
          skeleton: <Skeleton className="h-8 w-full" />,
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
          return <div className="font-mono text-sm">{contextLength.toLocaleString()}</div>
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
          return <div className="font-mono text-sm">{maxOutput.toLocaleString()}</div>
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
          return (
            <div className="font-mono">
              {formatPrice({
                priceKey: 'text_input',
                priceValue: inputPrice,
                unitSuffix: false,
              })}
            </div>
          )
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
          return (
            <div className="font-mono">
              {formatPrice({
                priceKey: 'text_output',
                priceValue: outputPrice,
                unitSuffix: false,
              })}
            </div>
          )
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
              value: formatPrice({
                priceKey: 'internal_reasoning',
                priceValue: pricing.internal_reasoning,
              }),
            })
          }
          if (pricing.image_input) {
            otherPrices.push({
              label: 'images_input:',
              value: formatPrice({ priceKey: 'image_input', priceValue: pricing.image_input }),
            })
          }
          if (pricing.image_output) {
            otherPrices.push({
              label: 'images_output:',
              value: formatPrice({ priceKey: 'image_output', priceValue: pricing.image_output }),
            })
          }
          if (pricing.audio_input) {
            otherPrices.push({
              label: 'audio_input:',
              value: formatPrice({ priceKey: 'audio_input', priceValue: pricing.audio_input }),
            })
          }
          if (pricing.audio_cache_input) {
            otherPrices.push({
              label: 'audio_cache_input:',
              value: formatPrice({
                priceKey: 'audio_cache_input',
                priceValue: pricing.audio_cache_input,
              }),
            })
          }
          if (pricing.cache_read) {
            otherPrices.push({
              label: 'cache_read:',
              value: formatPrice({ priceKey: 'cache_read', priceValue: pricing.cache_read }),
            })
          }
          if (pricing.cache_write) {
            otherPrices.push({
              label: 'cache_write:',
              value: formatPrice({ priceKey: 'cache_write', priceValue: pricing.cache_write }),
            })
          }
          if (pricing.request) {
            otherPrices.push({
              label: 'per_request:',
              value: formatPrice({ priceKey: 'request', priceValue: pricing.request }),
            })
          }
          if (pricing.web_search) {
            otherPrices.push({
              label: 'web_search:',
              value: formatPrice({ priceKey: 'web_search', priceValue: pricing.web_search }),
            })
          }
          if (pricing.discount && pricing.discount > 0) {
            otherPrices.push({
              label: 'discount:',
              value: formatPrice({ priceKey: 'discount', priceValue: pricing.discount }),
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
              value: `${limits.text_input_tokens.toLocaleString()}`,
            })
          }
          if (limits.image_input_tokens) {
            limitsList.push({
              label: 'max_image_tokens:',
              value: `${limits.image_input_tokens.toLocaleString()}`,
            })
          }
          if (limits.images_per_input) {
            limitsList.push({
              label: 'images_per_input:',
              value: `${limits.images_per_input.toLocaleString()}`,
            })
          }
          if (limits.requests_per_minute) {
            limitsList.push({
              label: 'req_per_min:',
              value: `${limits.requests_per_minute.toLocaleString()}`,
            })
          }
          if (limits.requests_per_day) {
            limitsList.push({
              label: 'req_per_day:',
              value: `${limits.requests_per_day.toLocaleString()}`,
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
}

export function EmptyCell() {
  return <div className="text-muted-foreground/60">—</div>
}
