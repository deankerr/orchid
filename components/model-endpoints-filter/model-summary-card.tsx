'use client'

import { memo } from 'react'
import Link from 'next/link'

import { AttributeBadge } from '@/components/attributes'
import { BrandIcon } from '@/components/shared/brand-icon'
import { NumericValue, PricingProperty } from '@/components/shared/numeric-value'
import { Pill } from '@/components/shared/pill'
import { useEndpointsList, useModelsList } from '@/hooks/api'
import { formatCompactNumber } from '@/lib/formatters'
import { cn, formatIsoDate } from '@/lib/utils'

import { ModelVariantBadge } from '../shared/model-variant-badge'
import { getModelCapabilities, type FilterResult } from './filter'

interface ModelSummaryCardProps {
  result: FilterResult
}

export const ModelSummaryCard = memo<ModelSummaryCardProps>(({ result }) => {
  const models = useModelsList()
  const endpoints = useEndpointsList()

  if (!models || !endpoints) {
    return null
  }

  const model = models.find((m) => m._id === result.modelId)
  const modelEndpoints = endpoints.filter((endp) => endp.model_slug === model?.slug)

  const topEndpoints = result.endpointIds
    .map((id) => endpoints.find((e) => e._id === id))
    .filter((endpoint): endpoint is NonNullable<typeof endpoint> => endpoint !== undefined)

  if (!model) {
    return null
  }

  // Get capabilities using centralized function
  const capabilities = getModelCapabilities(model, modelEndpoints)

  // Calculate total 7-day tokens across all variants
  const tokens7d = Object.values(model.stats || {}).reduce(
    (sum: number, variant: any) => sum + (variant.tokens_7d || 0),
    0,
  )

  return (
    <div className="space-y-5 rounded-sm border bg-card py-4 text-card-foreground">
      <div className="space-y-4 px-3">
        <div className="flex items-center justify-between pl-1">
          <div className="flex items-center gap-3">
            <BrandIcon url={model.icon_url} size={20} />

            <div className="text-base font-semibold md:text-lg">
              <Link href={`/models/${model.slug}`} className="transition-colors hover:text-primary">
                {model.name}
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 font-mono md:flex-row md:items-center md:gap-3">
            <Pill label="Added" className="rounded-sm">
              {formatIsoDate(model.or_created_at)}
            </Pill>
            <Pill label="Tokens 7D" className="rounded-sm">
              {formatCompactNumber(tokens7d)}
            </Pill>
          </div>
        </div>

        {/* Capability badges */}
        <div className="flex flex-wrap gap-2 font-mono uppercase">
          {/* Model-level capabilities */}
          {capabilities.hasImageInput && <AttributeBadge attribute="imageInput" />}
          {capabilities.hasFileInput && <AttributeBadge attribute="fileInput" />}
          {capabilities.hasReasoning && <AttributeBadge attribute="reasoning" />}

          {/* Endpoint-level capabilities */}
          {capabilities.hasTools && <AttributeBadge attribute="tools" />}
          {capabilities.hasJsonResponse && <AttributeBadge attribute="jsonObject" />}
          {capabilities.hasStructuredOutputs && <AttributeBadge attribute="structuredOutputs" />}
          {capabilities.hasPromptCaching && <AttributeBadge attribute="promptCaching" />}
        </div>
      </div>

      {/* Endpoints */}
      <div className="grid gap-1.5 px-3 [&>*]:px-2">
        <div className="grid grid-cols-8 gap-2 text-right font-mono text-xs text-foreground-dim uppercase">
          <div className="col-span-2 text-left">Endpoints</div>
          <div className="">Context</div>
          <div className="line-clamp-1">Max Output</div>
          <div className="truncate">TOK/SEC</div>
          <div className="truncate">Latency</div>
          <div className="">Input</div>
          <div className="">Output</div>
        </div>

        {topEndpoints.map((endpoint) => (
          <EndpointItem key={endpoint._id} endpoint={endpoint} />
        ))}

        <div className="col-span-full py-1">
          <Link href={`/models/${model.slug}`} className="text-sm text-primary hover:underline">
            → View more details
          </Link>
        </div>
      </div>
    </div>
  )
})

ModelSummaryCard.displayName = 'ModelSummaryCard'

interface EndpointItemProps {
  endpoint: NonNullable<ReturnType<typeof useEndpointsList>>[number]
}

const EndpointItem = memo<EndpointItemProps>(({ endpoint }) => {
  return (
    <div className="grid grid-cols-8 gap-1 rounded-sm bg-secondary py-2 font-mono text-sm">
      <div className={cn('col-span-2 flex items-center gap-2 font-sans')}>
        {/* Provider */}
        <BrandIcon url={endpoint.icon_url} size={16} />
        <div className="min-w-0 truncate font-medium">{endpoint.provider_name}</div>

        {/* Variant */}
        <ModelVariantBadge modelVariant={endpoint.model_variant} />
      </div>

      {/* Metrics */}
      {/* Context Length */}
      <NumericValue
        value={endpoint.context_length}
        abbreviate
        unit={'TOK'}
        className="*:data-[slot=unit]:hidden md:*:data-[slot=unit]:inline"
      />
      <NumericValue
        value={endpoint.limits.output_tokens}
        abbreviate
        unit={'TOK'}
        className="*:data-[slot=unit]:hidden md:*:data-[slot=unit]:inline"
      />
      {/* Throughput */}
      <NumericValue
        value={endpoint.stats?.p50_throughput}
        digits={0}
        abbreviate
        unit="TOK/S"
        className="*:data-[slot=unit]:hidden md:*:data-[slot=unit]:inline"
      />
      <NumericValue
        value={endpoint.stats?.p50_latency}
        digits={2}
        transform={(value) => value / 1000}
        unit="S"
        className="*:data-[slot=unit]:hidden md:*:data-[slot=unit]:inline"
      />

      {/* Pricing  */}
      <PricingProperty
        pricing={endpoint.pricing}
        field="input"
        fallbackToZero
        className="*:data-[slot=unit]:hidden md:*:data-[slot=unit]:inline"
      />
      <PricingProperty
        pricing={endpoint.pricing}
        field="output"
        fallbackToZero
        className="*:data-[slot=unit]:hidden md:*:data-[slot=unit]:inline"
      />
    </div>
  )
})

EndpointItem.displayName = 'EndpointItem'
