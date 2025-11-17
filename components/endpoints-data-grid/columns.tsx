import { ColumnDef } from '@tanstack/react-table'

import type { Doc } from '@/convex/_generated/dataModel'

import { DataGridColumnHeader } from '@/components/data-grid/data-grid-column-header'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getEndpointAttributeData } from '@/lib/attributes'
import { formatDateTime, formatPrice } from '@/lib/formatters'

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
      <DataGridColumnHeader column={column} title="MODEL" className="justify-start" />
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
    },
  },

  {
    id: 'provider',
    accessorFn: (row) => row.provider.name,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="PROVIDER" className="justify-start" />
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
    size: 260,
    sortingFn: fuzzySort,
    enableHiding: false,
    meta: {
      skeleton: <Skeleton className="h-8 w-full" />,
      headerTitle: 'Provider',
    },
  },

  {
    id: 'inputPrice',
    accessorFn: (row) => row.pricing.text_input,
    header: ({ column }) => (
      <div className="grow text-center">
        <DataGridColumnHeader column={column} title="INPUT" subtitle="$/MTOK" />
      </div>
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
    size: 120,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Input ($/MTOK)',
    },
  },

  {
    id: 'outputPrice',
    accessorFn: (row) => row.pricing.text_output,
    header: ({ column }) => (
      <div className="grow text-center">
        <DataGridColumnHeader column={column} title="OUTPUT" subtitle="$/MTOK" />
      </div>
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
    size: 120,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Output ($/MTOK)',
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
    size: 160,
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
    size: 254,
    meta: {
      headerClassName: 'text-center',
      headerTitle: 'Features',
      cellClassName: 'px-2',
      skeleton: <Skeleton className="h-6 w-full" />,
    },
  },

  {
    id: 'contextLength',
    accessorFn: (row) => row.context_length,
    header: ({ column }) => (
      <div className="grow text-center">
        <DataGridColumnHeader column={column} title="CONTEXT" subtitle="TOKENS" />
      </div>
    ),
    cell: ({ getValue }) => getValue<number>().toLocaleString(),
    size: 135,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Context (TOK)',
    },
  },

  {
    id: 'maxOutput',
    accessorFn: (row) => row.limits.text_output_tokens ?? row.context_length,
    header: ({ column }) => (
      <div className="grow text-center">
        <DataGridColumnHeader column={column} title="MAX OUT." subtitle="TOKENS" />
      </div>
    ),
    cell: ({ getValue }) => getValue<number | undefined>()?.toLocaleString(),
    size: 135,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Max Output (TOK)',
    },
  },

  {
    id: 'quantization',
    accessorFn: ({ quantization = '?' }) => (quantization === 'unknown' ? '?' : quantization),
    header: ({ column }) => (
      <div className="grow text-center">
        <DataGridColumnHeader column={column} title="QUANT." />
      </div>
    ),
    cell: ({ getValue }) => {
      return (
        <Badge variant="outline" className="rounded-sm font-mono text-sm uppercase">
          {getValue<string>()}
        </Badge>
      )
    },
    size: 120,
    meta: {
      skeleton: <Skeleton className="h-6 w-full" />,
      headerClassName: 'text-center',
      cellClassName: 'text-center px-2',
      headerTitle: 'Quant.',
    },
  },

  {
    id: 'throughput',
    accessorFn: (row) => row.stats?.p50_throughput,
    header: ({ column }) => (
      <div className="grow text-center">
        <DataGridColumnHeader column={column} title="TOK/SEC" />
      </div>
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
    size: 125,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'Speed (TOK/S)',
    },
  },

  {
    id: 'latency',
    accessorFn: (row) => row.stats?.p50_latency,
    header: ({ column }) => (
      <div className="grow text-center">
        <DataGridColumnHeader column={column} title="TTFT" subtitle="MS" />
      </div>
    ),
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
    size: 105,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-right',
      headerTitle: 'TTFT (MS)',
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

  {
    id: 'modelAddedAt',
    accessorFn: (row) => row.model.or_added_at,
    header: ({ column }) => (
      <div className="grow text-center">
        <DataGridColumnHeader column={column} title="ADDED" subtitle="MODEL" />
      </div>
    ),
    cell: ({ getValue }) => {
      const timestamp = getValue<number>()
      if (timestamp) {
        return formatDateTime(timestamp).split(' ')[0]
      } else {
        return <span className="text-muted-foreground">&ndash;</span>
      }
    },
    size: 120,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-center',
      headerTitle: 'Model Added (Date)',
    },
  },

  {
    id: 'unavailableAt',
    accessorFn: (row) => row.unavailable_at,
    header: ({ column }) => (
      <div className="grow text-center">
        <DataGridColumnHeader column={column} title="GONE" subtitle="ENDPOINT" />
      </div>
    ),
    cell: ({ getValue }) => {
      const timestamp = getValue<number>()
      if (timestamp) {
        return formatDateTime(timestamp).split(' ')[0]
      }
    },
    size: 125,
    sortUndefined: -1,
    meta: {
      skeleton: <Skeleton className="h-5 w-full" />,
      cellClassName: 'text-center',
      headerTitle: 'Unavailable (Date)',
    },
  },
]
