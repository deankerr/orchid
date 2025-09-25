import { useMemo } from 'react'

import { ColumnDef } from '@tanstack/react-table'

import type { Doc } from '@/convex/_generated/dataModel'

import { DataGridColumnHeader } from '@/components/data-grid/data-grid-column-header'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/formatters'

import { AttributeBadge, AttributeBadgeName, AttributeBadgeSet } from '../shared/attribute-badge'
import { EntityCard } from '../shared/entity-card'
import { ModalityBadgeSet } from '../shared/modality-badge'

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
            <EntityCard
              icon_url={endpoint.model.icon_url}
              name={endpoint.model.name}
              slug={endpoint.model.slug}
              className="grow"
            />
          )
        },
        size: 310,
        enableSorting: true,
        enableHiding: true,
        meta: {
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
            <EntityCard
              icon_url={endpoint.provider.icon_url}
              name={endpoint.provider.name}
              slug={endpoint.provider.tag_slug}
              className="grow"
            />
          )
        },
        size: 240,
        enableSorting: true,
        enableHiding: true,
        meta: {
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const endpoint = row.original
          return endpoint.disabled ? (
            <AttributeBadgeName name="disabled" />
          ) : endpoint.deranked ? (
            <AttributeBadgeName name="deranked" />
          ) : null
        },
        size: 80,
        enableHiding: true,
        meta: {
          headerClassName: 'text-center',
          skeleton: <Skeleton className="h-6 w-full" />,
          cellClassName: 'text-center',
        },
      },

      {
        id: 'modalities',
        header: 'Modalities',
        cell: ({ row }) => {
          const endpoint = row.original
          return <ModalityBadgeSet endpoint={endpoint} />
        },
        size: 160,
        enableHiding: true,
        meta: {
          headerClassName: 'text-center',
          skeleton: <Skeleton className="h-6 w-full" />,
        },
      },

      {
        id: 'features',
        header: 'Features',
        cell: ({ row }) => {
          const endpoint = row.original
          return (
            <AttributeBadgeSet
              endpoint={endpoint}
              attributes={[
                'reasoning',
                'mandatory_reasoning',
                'tools',
                'response_format',
                'structured_outputs',
                'caching',
                'implicit_caching',
                'native_web_search',
                'moderated',
                'free',
              ]}
            />
          )
        },
        size: 255,
        enableHiding: true,
        meta: {
          headerClassName: 'text-center',
          skeleton: <Skeleton className="h-6 w-full" />,
          cellClassName: 'text-center',
        },
      },

      {
        id: 'contextLength',
        accessorFn: (row) => row.context_length,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="CONTEXT" className="justify-center" />
        ),
        cell: ({ row }) => {
          const contextLength = row.original.context_length
          return <div className="font-mono text-sm">{contextLength.toLocaleString()}</div>
        },
        size: 120,
        enableSorting: true,
        enableHiding: true,
        meta: {
          skeleton: <Skeleton className="h-5 w-full" />,
          cellClassName: 'text-right',
        },
      },

      {
        id: 'maxOutput',
        accessorFn: (row) => row.limits.text_output_tokens || 0,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="MAX OUTPUT" className="justify-center" />
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
          skeleton: <Skeleton className="h-5 w-full" />,
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
          skeleton: <Skeleton className="h-6 w-full" />,
          headerClassName: 'text-center',
          cellClassName: 'text-center',
        },
      },

      {
        id: 'inputPrice',
        accessorFn: (row) => row.pricing.text_input || 0,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="INPUT $ PER MTOK" className="text-center" />
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
        size: 118,
        enableSorting: true,
        enableHiding: true,
        meta: {
          skeleton: <Skeleton className="h-5 w-full" />,
          cellClassName: 'text-right',
        },
      },

      {
        id: 'outputPrice',
        accessorFn: (row) => row.pricing.text_output || 0,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="OUTPUT $ PER MTOK" className="text-center" />
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
        size: 118,
        enableSorting: true,
        enableHiding: true,
        meta: {
          skeleton: <Skeleton className="h-5 w-full" />,
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
            className="text-center"
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
        size: 118,
        enableSorting: true,
        enableHiding: true,
        meta: {
          skeleton: <Skeleton className="h-5 w-full" />,
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
            className="text-center"
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
        size: 120,
        enableSorting: true,
        enableHiding: true,
        meta: {
          skeleton: <Skeleton className="h-5 w-full" />,
          cellClassName: 'text-right',
        },
      },

      {
        id: 'miscPricing',
        header: 'Other $',
        cell: ({ row }) => {
          const pricing = row.original.pricing
          const pricingItems = []

          if (pricing.internal_reasoning) {
            pricingItems.push(
              <AttributeBadge
                key="reasoning"
                icon="brain-cog"
                name="internal_reasoning"
                details={formatPrice({
                  priceKey: 'internal_reasoning',
                  priceValue: pricing.internal_reasoning,
                })}
                color="blue"
              />,
            )
          }

          if (pricing.image_output) {
            pricingItems.push(
              <AttributeBadge
                key="image_output"
                icon="image"
                name="image_output"
                details={formatPrice({
                  priceKey: 'image_output',
                  priceValue: pricing.image_output,
                })}
                color="purple"
              />,
            )
          }

          if (pricing.audio_input) {
            pricingItems.push(
              <AttributeBadge
                key="audio_input"
                icon="audio-lines"
                name="audio_input"
                details={formatPrice({
                  priceKey: 'audio_input',
                  priceValue: pricing.audio_input,
                })}
                color="green"
              />,
            )
          }

          if (pricing.audio_cache_input) {
            pricingItems.push(
              <AttributeBadge
                key="audio_cache_input"
                icon="audio-lines"
                name="audio_cache_input"
                details={formatPrice({
                  priceKey: 'audio_cache_input',
                  priceValue: pricing.audio_cache_input,
                })}
                color="cyan"
              />,
            )
          }

          if (pricing.cache_write) {
            pricingItems.push(
              <AttributeBadge
                key="cache_write"
                icon="database"
                name="cache_write"
                details={formatPrice({
                  priceKey: 'cache_write',
                  priceValue: pricing.cache_write,
                })}
                color="cyan"
              />,
            )
          }

          if (pricing.request) {
            pricingItems.push(
              <AttributeBadge
                key="request"
                icon="flag"
                name="request"
                details={formatPrice({
                  priceKey: 'request',
                  priceValue: pricing.request,
                })}
                color="yellow"
              />,
            )
          }

          if (pricing.web_search) {
            pricingItems.push(
              <AttributeBadge
                key="web_search"
                icon="globe"
                name="web_search"
                details={formatPrice({
                  priceKey: 'web_search',
                  priceValue: pricing.web_search,
                })}
                color="teal"
              />,
            )
          }

          if (pricingItems.length === 0) {
            return <EmptyCell />
          }

          return <div className="flex flex-wrap gap-1">{pricingItems}</div>
        },
        size: 130,
        enableHiding: true,
        meta: {
          headerClassName: 'text-center',
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'limits',
        header: 'LIMITS',
        cell: ({ row }) => {
          const endpoint = row.original
          return (
            <AttributeBadgeSet
              endpoint={endpoint}
              attributes={[
                'max_text_input_tokens',
                'max_image_input_tokens',
                'max_images_per_input',
                'max_requests_per_minute',
                'max_requests_per_day',
              ]}
            />
          )
        },
        size: 190,
        enableHiding: true,
        meta: {
          headerClassName: 'text-center',
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'dataPolicy',
        header: 'Data Policy',
        cell: ({ row }) => {
          const endpoint = row.original

          return (
            <AttributeBadgeSet
              endpoint={endpoint}
              attributes={['training', 'data_publishing', 'user_id', 'data_retention']}
            />
          )
        },
        size: 160,
        enableHiding: true,
        meta: {
          headerClassName: 'text-center',
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
