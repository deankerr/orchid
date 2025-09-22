import { useMemo } from 'react'

import { ColumnDef } from '@tanstack/react-table'
import {
  AlarmClockIcon,
  AudioLinesIcon,
  BrainCogIcon,
  CalendarIcon,
  DatabaseIcon,
  FlagIcon,
  GlobeIcon,
  ImageIcon,
  LetterTextIcon,
  SaveIcon,
} from 'lucide-react'

import type { Doc } from '@/convex/_generated/dataModel'

import { DataGridColumnHeader } from '@/components/data-grid/data-grid-column-header'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/formatters'

import {
  AttributeBadge,
  CustomAttributeBadge,
  getEndpointAttributes,
  hasEndpointAttribute,
} from '../shared/attribute-badge'
import { EntityCard } from '../shared/entity-card'
import { ModalityBadges } from '../shared/modality-badge'

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

              {hasEndpointAttribute(endpoint, 'moderated') && <AttributeBadge value="moderated" />}
              {hasEndpointAttribute(endpoint, 'deranked') && <AttributeBadge value="deranked" />}
              {hasEndpointAttribute(endpoint, 'disabled') && <AttributeBadge value="disabled" />}
              {hasEndpointAttribute(endpoint, 'free') && <AttributeBadge value="free" />}
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
          return <ModalityBadges modalities={endpoint.model.input_modalities} />
        },
        size: 160,
        enableHiding: true,
        meta: {
          headerTitle: 'Input Modalities',
          headerClassName: 'text-center',
          skeleton: <Skeleton className="h-6 w-full" />,
        },
      },

      {
        id: 'outputModalities',
        header: 'OUTPUT MODALITIES',
        cell: ({ row }) => {
          const endpoint = row.original
          return <ModalityBadges modalities={endpoint.model.output_modalities} />
        },
        size: 112,
        enableHiding: true,
        meta: {
          headerTitle: 'Output Modalities',
          headerClassName: 'text-center',
          skeleton: <Skeleton className="h-6 w-full" />,
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
          headerTitle: 'Context',
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
          headerTitle: 'Max Output',
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
          headerTitle: 'Input $ per MTOK',
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
          headerTitle: 'Output $ per MTOK',
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
          headerTitle: 'Cache Read $ per MTOK',
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
          headerTitle: 'Image Input $ per K',
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
              <CustomAttributeBadge
                key="reasoning"
                label="reasoning:"
                icon={<BrainCogIcon />}
                formattedValue={formatPrice({
                  priceKey: 'internal_reasoning',
                  priceValue: pricing.internal_reasoning,
                })}
                color="blue"
                variant="surface"
              />,
            )
          }

          if (pricing.image_output) {
            pricingItems.push(
              <CustomAttributeBadge
                key="image_output"
                label="images_output:"
                icon={<ImageIcon />}
                formattedValue={formatPrice({
                  priceKey: 'image_output',
                  priceValue: pricing.image_output,
                })}
                color="purple"
                variant="surface"
              />,
            )
          }

          if (pricing.audio_input) {
            pricingItems.push(
              <CustomAttributeBadge
                key="audio_input"
                label="audio_input:"
                icon={<AudioLinesIcon />}
                formattedValue={formatPrice({
                  priceKey: 'audio_input',
                  priceValue: pricing.audio_input,
                })}
                color="green"
                variant="surface"
              />,
            )
          }

          if (pricing.audio_cache_input) {
            pricingItems.push(
              <CustomAttributeBadge
                key="audio_cache_input"
                label="audio_cache_input:"
                icon={<AudioLinesIcon />}
                formattedValue={formatPrice({
                  priceKey: 'audio_cache_input',
                  priceValue: pricing.audio_cache_input,
                })}
                color="cyan"
                variant="surface"
              />,
            )
          }

          if (pricing.cache_write) {
            pricingItems.push(
              <CustomAttributeBadge
                key="cache_write"
                label="cache_write:"
                icon={<DatabaseIcon />}
                formattedValue={formatPrice({
                  priceKey: 'cache_write',
                  priceValue: pricing.cache_write,
                })}
                color="cyan"
                variant="surface"
              />,
            )
          }

          if (pricing.request) {
            pricingItems.push(
              <CustomAttributeBadge
                key="request"
                label="per_request:"
                icon={<FlagIcon />}
                formattedValue={formatPrice({
                  priceKey: 'request',
                  priceValue: pricing.request,
                })}
                color="yellow"
                variant="surface"
              />,
            )
          }

          if (pricing.web_search) {
            pricingItems.push(
              <CustomAttributeBadge
                key="web_search"
                label="web_search:"
                icon={<GlobeIcon />}
                formattedValue={formatPrice({
                  priceKey: 'web_search',
                  priceValue: pricing.web_search,
                })}
                color="teal"
                variant="surface"
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
          headerTitle: 'Misc $',
          headerClassName: 'text-center',
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },

      {
        id: 'limits',
        header: 'LIMITS',
        cell: ({ row }) => {
          const limits = row.original.limits
          const limitItems = []

          if (limits.text_input_tokens) {
            limitItems.push(
              <CustomAttributeBadge
                key="text_input_tokens"
                label="max_input:"
                icon={<LetterTextIcon />}
                formattedValue={`${limits.text_input_tokens.toLocaleString()}`}
                color="yellow"
                variant="surface"
              />,
            )
          }

          if (limits.image_input_tokens) {
            limitItems.push(
              <CustomAttributeBadge
                key="image_input_tokens"
                label="max_image_tokens:"
                icon={<ImageIcon />}
                formattedValue={`${limits.image_input_tokens.toLocaleString()}`}
                color="yellow"
                variant="surface"
              />,
            )
          }

          if (limits.images_per_input) {
            limitItems.push(
              <CustomAttributeBadge
                key="images_per_input"
                label="images_per_input:"
                icon={<ImageIcon />}
                formattedValue={`${limits.images_per_input.toLocaleString()}`}
                color="yellow"
                variant="surface"
              />,
            )
          }

          if (limits.requests_per_minute) {
            limitItems.push(
              <CustomAttributeBadge
                key="requests_per_minute"
                label="req_per_min:"
                icon={<AlarmClockIcon />}
                formattedValue={`${limits.requests_per_minute.toLocaleString()}`}
                color="yellow"
                variant="surface"
              />,
            )
          }

          if (limits.requests_per_day) {
            limitItems.push(
              <CustomAttributeBadge
                key="requests_per_day"
                label="req_per_day:"
                icon={<CalendarIcon />}
                formattedValue={`${limits.requests_per_day.toLocaleString()}`}
                color="yellow"
                variant="surface"
              />,
            )
          }

          if (limitItems.length === 0) {
            return <EmptyCell />
          }

          return <div className="flex flex-wrap gap-1">{limitItems}</div>
        },
        size: 130,
        enableHiding: true,
        meta: {
          headerTitle: 'Limits',
          headerClassName: 'text-center',
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
          ])

          return (
            <div className="flex gap-1">
              {attributes.map((attr) => (
                <AttributeBadge key={attr} value={attr} />
              ))}

              {hasEndpointAttribute(endpoint, 'retains') && (
                <CustomAttributeBadge
                  label="retains"
                  icon={<SaveIcon />}
                  formattedValue={`${endpoint.data_policy.retains_prompts_days?.toLocaleString() ?? 'unknown'} days`}
                  color="orange"
                  variant="surface"
                />
              )}
            </div>
          )
        },
        size: 130,
        enableHiding: true,
        meta: {
          headerTitle: 'Data Policy',
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
