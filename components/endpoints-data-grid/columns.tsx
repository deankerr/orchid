import { useMemo } from 'react'

import { ColumnDef } from '@tanstack/react-table'

import type { Doc } from '@/convex/_generated/dataModel'

import { DataGridColumnHeader } from '@/components/data-grid/data-grid-column-header'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/formatters'

import {
  AttributeBadge,
  getEndpointAttributes,
  hasEndpointAttribute,
} from '../shared/attribute-badge'
import { EntityCard } from '../shared/entity-card'
import { ModalityIconBadges } from '../shared/modality-icon-badge'

export type EndpointRow = Doc<'or_views_endpoints'>

export function useEndpointsColumns(): ColumnDef<EndpointRow>[] {
  return useMemo<ColumnDef<EndpointRow>[]>(
    () => [
      {
        id: 'model',
        accessorFn: (row) => row.model.name,
        header: ({ column }) => <DataGridColumnHeader column={column} title="MODEL" />,
        cell: ({ row }) => {
          const endpoint = row.original
          return (
            <div className="flex items-center gap-1">
              <EntityCard
                icon_url={endpoint.model.icon_url}
                name={endpoint.model.name}
                slug={endpoint.model.slug}
                className="grow"
              />

              {hasEndpointAttribute(endpoint, 'mandatory_reasoning') ? (
                <AttributeBadge value="mandatory_reasoning" />
              ) : hasEndpointAttribute(endpoint, 'reasoning') ? (
                <AttributeBadge value="reasoning" />
              ) : null}
            </div>
          )
        },
        size: 310,
        enableSorting: true,
        enableHiding: true,
        meta: {
          headerTitle: 'Model',
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'provider',
        accessorFn: (row) => row.provider.name,
        header: ({ column }) => <DataGridColumnHeader column={column} title="PROVIDER" />,
        cell: ({ row }) => {
          const endpoint = row.original
          return (
            <div className="flex items-center gap-1">
              <EntityCard
                icon_url={endpoint.provider.icon_url}
                name={endpoint.provider.name}
                slug={endpoint.provider.tag_slug}
                className="grow"
              />

              {hasEndpointAttribute(endpoint, 'free') && <AttributeBadge value="free" />}
              {hasEndpointAttribute(endpoint, 'moderated') && <AttributeBadge value="moderated" />}
              {hasEndpointAttribute(endpoint, 'deranked') && <AttributeBadge value="deranked" />}
              {hasEndpointAttribute(endpoint, 'disabled') && <AttributeBadge value="disabled" />}
            </div>
          )
        },
        size: 240,
        enableSorting: true,
        enableHiding: true,
        meta: {
          headerTitle: 'Provider',
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'features',
        header: 'Features',
        cell: ({ row }) => {
          const endpoint = row.original

          return (
            <div className="flex gap-1">
              {hasEndpointAttribute(endpoint, 'tools') && <AttributeBadge value="tools" />}

              {hasEndpointAttribute(endpoint, 'json_struct') ? (
                <AttributeBadge value="json_struct" />
              ) : hasEndpointAttribute(endpoint, 'json_format') ? (
                <AttributeBadge value="json_format" />
              ) : null}

              {hasEndpointAttribute(endpoint, 'implicit_caching') ? (
                <AttributeBadge value="implicit_caching" />
              ) : hasEndpointAttribute(endpoint, 'caching') ? (
                <AttributeBadge value="caching" />
              ) : null}

              {hasEndpointAttribute(endpoint, 'native_web_search') && (
                <AttributeBadge value="native_web_search" />
              )}
            </div>
          )
        },
        size: 160,
        enableHiding: true,
        meta: {
          headerTitle: 'Variant',
          headerClassName: 'text-center',
          skeleton: <Skeleton className="h-6 w-full" />,
          cellClassName: 'text-center',
        },
      },

      {
        id: 'inputModalities',
        header: 'INPUT MODALITIES',
        cell: ({ row }) => {
          const endpoint = row.original

          return (
            <ModalityIconBadges
              className="min-w-16 gap-px"
              modalities={endpoint.model.input_modalities}
            />
          )
        },
        size: 112,
        enableHiding: true,
        meta: {
          headerTitle: 'Input Modalities',
          skeleton: <Skeleton className="h-6 w-full" />,
        },
      },

      {
        id: 'outputModalities',
        header: 'OUTPUT MODALITIES',
        cell: ({ row }) => {
          const endpoint = row.original

          return (
            <ModalityIconBadges
              className="min-w-16"
              modalities={endpoint.model.output_modalities}
            />
          )
        },
        size: 112,
        enableHiding: true,
        meta: {
          headerTitle: 'Output Modalities',
          skeleton: <Skeleton className="h-6 w-full" />,
        },
      },

      {
        id: 'contextLength',
        accessorFn: (row) => row.context_length,
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="CONTEXT"
            className="justify-end text-right"
          />
        ),
        cell: ({ row }) => {
          const contextLength = row.original.context_length
          return <div className="font-mono text-sm">{contextLength.toLocaleString()}</div>
        },
        size: 110,
        enableSorting: true,
        enableHiding: true,
        meta: {
          headerTitle: 'Context',
          skeleton: <Skeleton className="h-4 w-full" />,
          headerClassName: 'text-right',
          cellClassName: 'text-right',
        },
      },

      {
        id: 'maxOutput',
        accessorFn: (row) => row.limits.text_output_tokens || 0,
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="MAX OUTPUT"
            className="justify-end text-right"
          />
        ),
        cell: ({ row }) => {
          const maxOutput = row.original.limits.text_output_tokens
          if (!maxOutput) {
            return <EmptyCell />
          }
          return <div className="font-mono text-sm">{maxOutput.toLocaleString()}</div>
        },
        size: 120,
        enableSorting: true,
        enableHiding: true,
        meta: {
          headerTitle: 'Max Output',
          skeleton: <Skeleton className="h-4 w-full" />,
          cellClassName: 'text-right',
        },
      },

      {
        id: 'quantization',
        header: 'QUANT.',
        cell: ({ row }) => {
          const quantization = row.original.quantization
          return (
            <Badge variant="outline" className="font-mono text-sm uppercase">
              {!quantization || quantization === 'unknown' ? '?' : quantization}
            </Badge>
          )
        },
        size: 96,
        enableHiding: true,
        meta: {
          headerTitle: 'Quantization',
          skeleton: <Skeleton className="h-6 w-full" />,
          headerClassName: 'text-center',
          cellClassName: 'text-center',
        },
      },

      {
        id: 'inputPrice',
        accessorFn: (row) => row.pricing.text_input || 0,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="INPUT $ PER MTOK" className="text-right" />
        ),
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
        size: 115,
        enableSorting: true,
        enableHiding: true,
        meta: {
          headerTitle: 'Input $ per MTOK',
          skeleton: <Skeleton className="h-4 w-full" />,
          cellClassName: 'text-right',
        },
      },

      {
        id: 'outputPrice',
        accessorFn: (row) => row.pricing.text_output || 0,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="OUTPUT $ PER MTOK" className="text-right" />
        ),
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
        size: 115,
        enableSorting: true,
        enableHiding: true,
        meta: {
          headerTitle: 'Output $ per MTOK',
          skeleton: <Skeleton className="h-4 w-full" />,
          cellClassName: 'text-right',
        },
      },

      {
        id: 'cacheReadPrice',
        accessorFn: (row) => row.pricing.cache_read || 0,
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="CACHE READ $ PER MTOK"
            className="text-right"
          />
        ),
        cell: ({ row }) => {
          const cacheReadPrice = row.original.pricing.cache_read
          if (!cacheReadPrice) {
            return <EmptyCell />
          }
          return (
            <div className="font-mono">
              {formatPrice({
                priceKey: 'cache_read',
                priceValue: cacheReadPrice,
                unitSuffix: false,
              })}
            </div>
          )
        },
        size: 115,
        enableSorting: true,
        enableHiding: true,
        meta: {
          headerTitle: 'Cache Read $ per MTOK',
          skeleton: <Skeleton className="h-4 w-full" />,
          cellClassName: 'text-right',
        },
      },

      {
        id: 'imageInputPrice',
        accessorFn: (row) => row.pricing.image_input || 0,
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="IMAGE INPUT $ PER K"
            className="text-right"
          />
        ),
        cell: ({ row }) => {
          const imageInputPrice = row.original.pricing.image_input
          if (!imageInputPrice) {
            return <EmptyCell />
          }
          return (
            <div className="font-mono">
              {formatPrice({
                priceKey: 'image_input',
                priceValue: imageInputPrice,
                unitSuffix: false,
              })}
            </div>
          )
        },
        size: 125,
        enableSorting: true,
        enableHiding: true,
        meta: {
          headerTitle: 'Image Input $ per K',
          skeleton: <Skeleton className="h-4 w-full" />,
          cellClassName: 'text-right',
        },
      },

      {
        id: 'miscPricing',
        header: 'MISC $',
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
        enableHiding: true,
        meta: {
          headerTitle: 'Misc $',
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'limits',
        header: 'LIMITS',
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
        enableHiding: true,
        meta: {
          headerTitle: 'Limits',
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'dataPolicy',
        header: 'Data Policy',
        cell: ({ row }) => {
          const endpoint = row.original
          const attributes = getEndpointAttributes(endpoint, [
            'trains',
            'publishes',
            'requires_ids',
            'retains',
          ])

          return (
            <div className="flex gap-1">
              {attributes.map((attr) => (
                <AttributeBadge key={attr} value={attr} />
              ))}
            </div>
          )
        },
        size: 160,
        enableHiding: true,
        meta: {
          headerTitle: 'Data Policy',
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
