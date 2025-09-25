import { useMemo } from 'react'

import { ColumnDef } from '@tanstack/react-table'

import type { Doc } from '@/convex/_generated/dataModel'

import { DataGridColumnHeader } from '@/components/data-grid/data-grid-column-header'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/formatters'

import { AttributeBadgeName, AttributeBadgeSet } from '../shared/attribute-badge'
import { EntityCard } from '../shared/entity-card'
import { ModalityBadgeSet } from '../shared/modality-badge'
import { PricingBadgeSet } from '../shared/pricing-badges'

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
            <div className="flex items-center">
              <EntityCard
                icon_url={endpoint.provider.icon_url}
                name={endpoint.provider.name}
                slug={endpoint.provider.tag_slug}
                className="grow"
              />

              {endpoint.disabled ? (
                <AttributeBadgeName name="disabled" />
              ) : endpoint.deranked ? (
                <AttributeBadgeName name="deranked" />
              ) : null}
            </div>
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
        id: 'miscPricing',
        header: 'Other $',
        cell: ({ row }) => {
          const endpoint = row.original
          const pricingBadges = <PricingBadgeSet endpoint={endpoint} />

          if (!pricingBadges) {
            return <EmptyCell />
          }

          return pricingBadges
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
              hideUnavailable
            />
          )
        },
        size: 130,
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
              hideUnavailable
            />
          )
        },
        size: 130,
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
