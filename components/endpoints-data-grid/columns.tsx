import { ColumnDef } from '@tanstack/react-table'

import type { Doc } from '@/convex/_generated/dataModel'

import { DataGridColumnHeader } from '@/components/data-grid/data-grid-column-header'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getEndpointAttributeData } from '@/lib/attributes'
import { formatPrice } from '@/lib/formatters'

import { fuzzySort } from '../data-grid/data-grid-fuzzy'
import { AttributeBadge, AttributeBadgeName, AttributeBadgeSet } from '../shared/attribute-badge'
import { EntityCard } from '../shared/entity-card'
import { ModalityBadgeSet } from '../shared/modality-badge'
import { PricingBadgeSet } from '../shared/pricing-badges'

export type EndpointRow = Doc<'or_views_endpoints'>

export const columns: ColumnDef<EndpointRow>[] = [
  {
    id: 'model',
    accessorFn: (row) => `${row.model.name} ${row.model.slug}`,
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
    sortingFn: fuzzySort,
    enableHiding: false,
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

      const endpointGone = getEndpointAttributeData(endpoint, 'gone')

      return (
        <div className="flex items-center gap-1">
          <EntityCard
            icon_url={endpoint.provider.icon_url}
            name={endpoint.provider.name}
            slug={endpoint.provider.tag_slug}
            className="grow"
          />

          {endpointGone.has ? (
            <AttributeBadge
              sprite={endpointGone.icon}
              name={endpointGone.name}
              details={endpointGone.details}
              color={endpointGone.color}
              variant="soft"
            />
          ) : endpoint.disabled ? (
            <AttributeBadgeName name="disabled" />
          ) : endpoint.deranked ? (
            <AttributeBadgeName name="deranked" />
          ) : null}
        </div>
      )
    },
    size: 240,
    enableSorting: true,
    sortingFn: fuzzySort,
    enableHiding: false,
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
    meta: {
      headerClassName: 'text-center',
      skeleton: <Skeleton className="h-6 w-full" />,
    },
  },

  {
    id: 'throughput',
    accessorFn: (row) => row.stats?.p50_throughput,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="TOKENS PER SEC" className="justify-center" />
    ),
    cell: ({ getValue }) => {
      const throughput = getValue<number | undefined>()
      if (throughput) {
        return `${throughput.toLocaleString('en-US', {
          maximumFractionDigits: 0,
        })}`
      }
    },
    size: 100,
    enableSorting: true,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
    },
  },

  {
    id: 'latency',
    accessorFn: (row) => row.stats?.p50_latency,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="LATENCY MS" className="justify-center" />
    ),
    cell: ({ getValue }) => {
      const latency = getValue<number | undefined>()
      if (latency) {
        return `${latency.toLocaleString('en-US', {
          maximumFractionDigits: 0,
        })}`
      }
    },
    size: 100,
    enableSorting: true,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
    },
  },

  {
    id: 'contextLength',
    accessorFn: (row) => row.context_length,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="CONTEXT" className="justify-center" />
    ),
    cell: ({ getValue }) => getValue<number>().toLocaleString(),
    size: 120,
    enableSorting: true,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
    },
  },

  {
    id: 'maxOutput',
    accessorFn: (row) => row.limits.text_output_tokens,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="MAX OUTPUT" className="justify-center" />
    ),
    cell: ({ getValue }) => getValue<number | undefined>()?.toLocaleString(),
    size: 120,
    enableSorting: true,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
    },
  },

  {
    id: 'quantization',
    accessorFn: ({ quantization = '?' }) => (quantization === 'unknown' ? '?' : quantization),
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="QUANT" className="justify-center" />
    ),
    cell: ({ getValue }) => {
      return (
        <Badge variant="outline" className="font-mono text-sm uppercase">
          {getValue<string>()}
        </Badge>
      )
    },
    size: 96,
    enableSorting: true,
    meta: {
      skeleton: <Skeleton className="h-6 w-full" />,
      headerClassName: 'text-center',
      cellClassName: 'text-center',
    },
  },

  {
    id: 'inputPrice',
    accessorFn: (row) => row.pricing.text_input,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="INPUT $ PER MTOK" className="text-center" />
    ),
    cell: ({ getValue }) => {
      const inputPrice = getValue<number>()
      if (inputPrice) {
        return formatPrice({
          priceKey: 'text_input',
          priceValue: inputPrice,
          unitSuffix: false,
        })
      }
    },
    size: 118,
    enableSorting: true,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
    },
  },

  {
    id: 'outputPrice',
    accessorFn: (row) => row.pricing.text_output,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="OUTPUT $ PER MTOK" className="text-center" />
    ),
    cell: ({ getValue }) => {
      const outputPrice = getValue<number>()
      if (outputPrice) {
        return formatPrice({
          priceKey: 'text_output',
          priceValue: outputPrice,
          unitSuffix: false,
        })
      }
    },
    size: 118,
    enableSorting: true,
    sortUndefined: -1,
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

      return pricingBadges
    },
    size: 130,
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
    meta: {
      headerClassName: 'text-center',
      skeleton: <Skeleton className="h-8 w-full" />,
    },
  },
]
