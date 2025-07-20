'use client'

import Link from 'next/link'

import { useEndpointsList, useModelsList } from '@/hooks/api'

import { BrandIcon } from '../brand-icon/brand-icon'
import { NumericValue, PricingProperty } from '../numeric-value'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { type FilterResult } from './types'

// Internal tooltip wrapper component for consistent styling
function TooltipWrapper({
  children,
  content,
  className,
}: {
  children: React.ReactNode
  content: string
  className?: string
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${className} cursor-help font-mono whitespace-pre`}>{children}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface ModelFilterResultsProps {
  results: FilterResult[]
  isLoading?: boolean
  hasMore?: boolean
  onShowMore?: () => void
}

export function ModelFilterResults({
  results,
  isLoading,
  hasMore = false,
  onShowMore,
}: ModelFilterResultsProps) {
  const models = useModelsList()
  const endpoints = useEndpointsList()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-2 text-lg font-medium text-muted-foreground">No models found</div>
        <div className="text-sm text-muted-foreground">
          Try adjusting your filters or search query
        </div>
      </div>
    )
  }

  if (!models || !endpoints) {
    return null
  }

  return (
    <div className="space-y-4">
      {results.map((result) => {
        const model = models.find((m) => m._id === result.modelId)
        const modelEndpoints = result.endpointIds
          .map((id) => endpoints.find((e) => e._id === id))
          .filter((endpoint): endpoint is NonNullable<typeof endpoint> => endpoint !== undefined)

        if (!model) return null

        // Calculate total tokens across variants
        const totalTokens7d = Object.values(model.stats || {}).reduce(
          (sum: number, variant: any) => sum + (variant.tokens_7d || 0),
          0,
        )

        return (
          <div key={result.modelId} className="border p-2">
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

            <div className="mb-4 text-sm text-muted-foreground">
              {model.author_name} • Created {new Date(model.or_created_at).toLocaleDateString()}
            </div>

            {/* Endpoints */}
            <div className="min-w-0 space-y-2">
              {modelEndpoints.map((endpoint) => {
                return (
                  <div
                    key={endpoint._id}
                    className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-xs tabular-nums md:text-sm"
                  >
                    {/* Provider */}
                    <BrandIcon slug={endpoint.provider_slug} size={16} />
                    <div className="min-w-0 flex-shrink truncate font-medium">
                      {endpoint.provider_name}
                    </div>

                    {/* Variant */}
                    {endpoint.model_variant !== 'standard' && (
                      <Badge variant="outline">{endpoint.model_variant}</Badge>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Metrics */}
                    {/* Context Length */}
                    <div className="w-18">
                      <NumericValue value={endpoint.context_length} unit={'TOK'} abbreviate />
                    </div>

                    <div className="w-18">
                      <NumericValue value={endpoint.limits.output_tokens} abbreviate unit={'TOK'} />
                    </div>

                    {/* Throughput */}
                    <div className="w-18">
                      <NumericValue
                        value={endpoint.stats?.p50_throughput}
                        digits={0}
                        abbreviate
                        unit="TOK/S"
                      />
                    </div>

                    {/* Latency */}
                    <div className="hidden w-18 md:block">
                      <NumericValue
                        value={endpoint.stats?.p50_latency}
                        digits={2}
                        transform={(v) => v / 1000}
                        unit="SEC"
                      />
                    </div>

                    {/* Pricing  */}
                    <div className="w-24">
                      <PricingProperty pricing={endpoint.pricing} field="input" fallbackToZero />
                    </div>

                    <div className="w-24">
                      <PricingProperty pricing={endpoint.pricing} field="output" fallbackToZero />
                    </div>
                  </div>
                )
              })}

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
      })}

      {/* Show More Button */}
      {hasMore && onShowMore && (
        <div className="pt-4 text-center">
          <Button variant="outline" onClick={onShowMore} size="lg">
            Show 20 more models
          </Button>
        </div>
      )}
    </div>
  )
}
