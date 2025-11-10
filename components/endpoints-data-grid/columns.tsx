import { ColumnDef } from '@tanstack/react-table'

import type { Doc } from '@/convex/_generated/dataModel'

import { DataGridColumnHeader } from '@/components/data-grid/data-grid-column-header'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getEndpointAttributeData } from '@/lib/attributes'
import { formatPrice } from '@/lib/formatters'

import { fuzzySort } from '../data-grid/data-grid-fuzzy'
import { AttributeBadge, AttributeBadgeName, AttributeBadgeSet } from '../shared/attribute-badge'
import { EntityBadge } from '../shared/entity-badge'
import { PricingBadgeSet } from '../shared/pricing-badges'

export type EndpointRow = Doc<'or_views_endpoints'>

export const columns: ColumnDef<EndpointRow>[] = [
  {
    id: 'model',
    accessorFn: (row) => `${row.model.name} ${row.model.slug}`,
    header: ({ column }) => (
      <DataGridColumnHeader
        column={column}
        title="MODEL"
        className="justify-start has-[>svg]:pl-4"
      />
    ),
    cell: ({ row }) => {
      const endpoint = row.original
      return <EntityBadge name={endpoint.model.name} slug={endpoint.model.slug} />
    },
    size: 260,
    sortingFn: fuzzySort,
    enableHiding: false,
    meta: {
      skeleton: <Skeleton className="h-8 w-full" />,
      headerTitle: 'Model',
      cellClassName: 'pl-3 pr-0',
    },
  },

  {
    id: 'provider',
    accessorFn: (row) => row.provider.name,
    header: ({ column }) => (
      <DataGridColumnHeader
        column={column}
        title="PROVIDER"
        className="justify-start has-[>svg]:pl-3"
      />
    ),
    cell: ({ row }) => {
      const endpoint = row.original

      const endpointGone = getEndpointAttributeData(endpoint, 'gone')

      return (
        <div className="flex items-center gap-1">
          <div className="grow">
            <EntityBadge name={endpoint.provider.name} slug={endpoint.provider.tag_slug} />
          </div>

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
    size: 220,
    sortingFn: fuzzySort,
    enableHiding: false,
    meta: {
      skeleton: <Skeleton className="h-8 w-full" />,
      headerTitle: 'Provider',
      cellClassName: 'pl-3 pr-0',
    },
  },

  {
    id: 'inputPrice',
    accessorFn: (row) => row.pricing.text_input,
    header: ({ column }) => <DataGridColumnHeader column={column} title="INPUT $ PER MTOK" />,
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
    size: 110,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Input $',
    },
  },

  {
    id: 'outputPrice',
    accessorFn: (row) => row.pricing.text_output,
    header: ({ column }) => <DataGridColumnHeader column={column} title="OUTPUT $ PER MTOK" />,
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
    size: 110,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Output $',
    },
  },

  {
    id: 'modalities',
    header: 'Modalities',
    cell: ({ row }) => {
      const endpoint = row.original
      return (
        <AttributeBadgeSet
          endpoint={endpoint}
          attributes={['image_input', 'file_input', 'audio_input', 'image_output']}
        />
      )
    },
    size: 144,
    meta: {
      headerClassName: 'text-center',
      skeleton: <Skeleton className="h-6 w-full" />,
      headerTitle: 'Modalities',
      cellClassName: 'px-2',
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
    size: 244,
    meta: {
      headerClassName: 'text-center',
      headerTitle: 'Features',
      cellClassName: 'text-center px-2',
      skeleton: <Skeleton className="h-6 w-full" />,
    },
  },

  {
    id: 'throughput',
    accessorFn: (row) => row.stats?.p50_throughput,
    header: ({ column }) => <DataGridColumnHeader column={column} title="TOKENS PER SEC" />,
    cell: ({ getValue }) => {
      const throughput = getValue<number | undefined>()
      if (throughput) {
        return `${throughput.toLocaleString('en-US', {
          maximumFractionDigits: 0,
        })}`
      }
    },
    size: 100,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Throughput',
    },
  },

  {
    id: 'latency',
    accessorFn: (row) => row.stats?.p50_latency,
    header: ({ column }) => <DataGridColumnHeader column={column} title="LATENCY MS" />,
    cell: ({ getValue }) => {
      const latency = getValue<number | undefined>()
      if (latency) {
        return `${latency.toLocaleString('en-US', {
          maximumFractionDigits: 0,
        })}`
      }
    },
    size: 100,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Latency',
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
    size: 135,
    meta: {
      headerClassName: 'text-center',
      skeleton: <Skeleton className="h-8 w-full" />,
      headerTitle: 'Limits',
      cellClassName: 'px-2',
    },
  },

  {
    id: 'contextLength',
    accessorFn: (row) => row.context_length,
    header: ({ column }) => <DataGridColumnHeader column={column} title="CONTEXT" />,
    cell: ({ getValue }) => getValue<number>().toLocaleString(),
    size: 120,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Context',
    },
  },

  {
    id: 'maxOutput',
    accessorFn: (row) => row.limits.text_output_tokens,
    header: ({ column }) => <DataGridColumnHeader column={column} title="MAX OUTPUT" />,
    cell: ({ getValue }) => getValue<number | undefined>()?.toLocaleString(),
    size: 120,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Max Output',
    },
  },

  {
    id: 'otherPricing',
    header: 'Other $',
    cell: ({ row }) => {
      const endpoint = row.original
      const pricingBadges = <PricingBadgeSet endpoint={endpoint} />

      return pricingBadges
    },
    size: 135,
    meta: {
      headerClassName: 'text-center',
      skeleton: <Skeleton className="h-8 w-full" />,
      headerTitle: 'Other $',
      cellClassName: 'px-2',
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
    size: 135,
    meta: {
      headerClassName: 'text-center',
      skeleton: <Skeleton className="h-8 w-full" />,
      headerTitle: 'Data Policy',
      cellClassName: 'px-2',
    },
  },

  {
    id: 'quantization',
    accessorFn: ({ quantization = '?' }) => (quantization === 'unknown' ? '?' : quantization),
    header: ({ column }) => <DataGridColumnHeader column={column} title="QUANT" />,
    cell: ({ getValue }) => {
      return (
        <Badge variant="outline" className="font-mono text-sm uppercase">
          {getValue<string>()}
        </Badge>
      )
    },
    size: 96,
    meta: {
      skeleton: <Skeleton className="h-6 w-full" />,
      headerClassName: 'text-center',
      cellClassName: 'text-center px-2',
      headerTitle: 'Quantization',
    },
  },
]
