'use client'

import { memo } from 'react'
import Link from 'next/link'

import { useEndpointsList, useModelsList } from '@/hooks/api'

import { BrandIcon } from '../../brand-icon/brand-icon'
import { NumericValue, PricingProperty } from '../../numeric-value'
import { Badge } from '../../ui/badge'
import { type FilterResult } from '../types'

interface ModelFilterItemProps {
  result: FilterResult
}

interface EndpointItemProps {
  endpoint: NonNullable<ReturnType<typeof useEndpointsList>>[number]
}

const EndpointItem = memo<EndpointItemProps>(({ endpoint }) => {
  return (
    <div className="flex items-center gap-2 bg-muted/50 p-2 text-xs tabular-nums md:text-sm">
      <div className="flex min-w-0 items-center gap-2">
        {/* Provider */}
        <BrandIcon slug={endpoint.provider_slug} size={16} />
        <div className="min-w-0 truncate font-medium">{endpoint.provider_name}</div>

        {/* Variant */}
        {endpoint.model_variant !== 'standard' && (
          <Badge variant="outline">{endpoint.model_variant}</Badge>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Metrics */}
      {/* Context Length */}
      <div className="w-18 grid-cols-2 gap-2 md:grid md:w-36">
        <NumericValue value={endpoint.context_length} abbreviate unit={'TOK'} />
        <NumericValue value={endpoint.limits.output_tokens} abbreviate unit={'TOK'} />
      </div>

      {/* Throughput */}
      <div className="w-18">
        <NumericValue value={endpoint.stats?.p50_throughput} digits={0} abbreviate unit="TOK/S" />
      </div>

      {/* Pricing  */}
      <div className="w-24 grid-cols-2 gap-2 md:grid md:w-48">
        <PricingProperty pricing={endpoint.pricing} field="input" fallbackToZero />
        <PricingProperty pricing={endpoint.pricing} field="output" fallbackToZero />
      </div>
    </div>
  )
})

EndpointItem.displayName = 'EndpointItem'

export const ModelFilterItem = memo<ModelFilterItemProps>(({ result }) => {
  const models = useModelsList()
  const endpoints = useEndpointsList()

  if (!models || !endpoints) {
    return null
  }

  const model = models.find((m) => m._id === result.modelId)
  const modelEndpoints = result.endpointIds
    .map((id) => endpoints.find((e) => e._id === id))
    .filter((endpoint): endpoint is NonNullable<typeof endpoint> => endpoint !== undefined)

  if (!model) {
    return null
  }

  return (
    <div className="border bg-card p-3 text-card-foreground">
      <div className="mb-2 flex items-center gap-3">
        <BrandIcon slug={model.slug} size={20} />

        <div className="text-lg font-semibold">
          <Link
            href={`/models/${encodeURIComponent(model.slug)}`}
            className="transition-colors hover:text-primary"
          >
            {model.short_name}
          </Link>
        </div>

        {/* Capability badges */}
        <div className="flex gap-1">
          {model.input_modalities.includes('image') && (
            <Badge variant="secondary" className="text-xs">
              image
            </Badge>
          )}
          {model.input_modalities.includes('file') && (
            <Badge variant="secondary" className="text-xs">
              file
            </Badge>
          )}
          {model.reasoning_config && (
            <Badge variant="secondary" className="text-xs">
              reasoning
            </Badge>
          )}
        </div>
      </div>

      {/* Endpoints */}
      <div className="min-w-0 space-y-2">
        {modelEndpoints.map((endpoint) => (
          <EndpointItem key={endpoint._id} endpoint={endpoint} />
        ))}

        {model.variants.length > modelEndpoints.length && (
          <div className="pt-2">
            <Link
              href={`/models/${encodeURIComponent(model.slug)}`}
              className="text-sm text-primary hover:underline"
            >
              → View all {model.variants.length} endpoints
            </Link>
          </div>
        )}
      </div>
    </div>
  )
})

ModelFilterItem.displayName = 'ModelFilterItem'
