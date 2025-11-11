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
      cellClassName: 'pl-3 pr-3',
    },
  },

  {
    id: 'inputPrice',
    accessorFn: (row) => row.pricing.text_input,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="INPUT" subtitle="$/MTOK" />
    ),
    cell: ({ getValue }) => {
      const inputPrice = getValue<number>()
      if (inputPrice) {
        return formatPrice({
          priceKey: 'text_input',
          priceValue: inputPrice,
          unitSuffix: false,
        })
      } else {
        return <span className="text-muted-foreground">&ndash;</span>
      }
    },
    size: 165,
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
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="OUTPUT" subtitle="$/MTOK" />
    ),
    cell: ({ getValue }) => {
      const outputPrice = getValue<number>()
      if (outputPrice) {
        return formatPrice({
          priceKey: 'text_output',
          priceValue: outputPrice,
          unitSuffix: false,
        })
      } else {
        return <span className="text-muted-foreground">&ndash;</span>
      }
    },
    size: 165,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Output $',
    },
  },

  {
    id: 'modalities',
    header: ({ column }) => <DataGridColumnHeader column={column} title="MODALITIES" />,
    cell: ({ row }) => {
      const endpoint = row.original
      return (
        <AttributeBadgeSet
          endpoint={endpoint}
          attributes={['image_input', 'file_input', 'audio_input', 'image_output']}
        />
      )
    },
    size: 150,
    meta: {
      headerClassName: 'text-center',
      skeleton: <Skeleton className="h-6 w-full" />,
      headerTitle: 'Modalities',
      cellClassName: 'px-2',
    },
  },

  {
    id: 'features',
    header: ({ column }) => <DataGridColumnHeader column={column} title="FEATURES" />,
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
    id: 'contextLength',
    accessorFn: (row) => row.context_length,
    header: ({ column }) => <DataGridColumnHeader column={column} title="CONTEXT" subtitle="TOK" />,
    cell: ({ getValue }) => getValue<number>().toLocaleString(),
    size: 150,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Context',
    },
  },

  {
    id: 'maxOutput',
    accessorFn: (row) => row.limits.text_output_tokens ?? row.context_length,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="MAX OUTPUT" subtitle="TOK" />
    ),
    cell: ({ getValue }) => getValue<number | undefined>()?.toLocaleString(),
    size: 150,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Max Output',
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
    size: 150,
    meta: {
      skeleton: <Skeleton className="h-6 w-full" />,
      headerClassName: 'text-center',
      cellClassName: 'text-center px-2',
      headerTitle: 'Quantization',
    },
  },

  {
    id: 'throughput',
    accessorFn: (row) => row.stats?.p50_throughput,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="THROUGHPUT" subtitle="TOK/SEC" />
    ),
    cell: ({ getValue }) => {
      const throughput = getValue<number | undefined>()
      if (throughput) {
        return `${throughput.toLocaleString('en-US', {
          maximumFractionDigits: 0,
        })}`
      } else {
        return <span className="text-muted-foreground">&ndash;</span>
      }
    },
    size: 150,
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
    header: ({ column }) => <DataGridColumnHeader column={column} title="LATENCY" subtitle="MS" />,
    cell: ({ getValue }) => {
      const latency = getValue<number | undefined>()
      if (latency) {
        return `${latency.toLocaleString('en-US', {
          maximumFractionDigits: 0,
        })}`
      } else {
        return <span className="text-muted-foreground">&ndash;</span>
      }
    },
    size: 150,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Latency',
    },
  },

  {
    id: 'otherPricing',
    header: ({ column }) => <DataGridColumnHeader column={column} title="OTHER $" />,
    cell: ({ row }) => {
      const endpoint = row.original
      const pricingBadges = <PricingBadgeSet endpoint={endpoint} />

      return pricingBadges
    },
    size: 150,
    meta: {
      headerClassName: 'text-center',
      skeleton: <Skeleton className="h-8 w-full" />,
      headerTitle: 'Other $',
      cellClassName: 'px-2',
    },
  },

  {
    id: 'dataPolicy',
    header: ({ column }) => <DataGridColumnHeader column={column} title="DATA POLICY" />,
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
    size: 150,
    meta: {
      headerClassName: 'text-center',
      skeleton: <Skeleton className="h-8 w-full" />,
      headerTitle: 'Data Policy',
      cellClassName: 'px-2',
    },
  },

  {
    id: 'limits',
    header: ({ column }) => <DataGridColumnHeader column={column} title="LIMITS" />,
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
    size: 150,
    meta: {
      headerClassName: 'text-center',
      skeleton: <Skeleton className="h-8 w-full" />,
      headerTitle: 'Limits',
      cellClassName: 'px-2',
    },
  },
]
