'use client'

import Link from 'next/link'

import { useEndpointsList, useModelsList } from '@/hooks/api'

import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { type FilterResult } from './types'

interface ModelFilterResultsProps {
  results: FilterResult[]
  isLoading?: boolean
  hasMore?: boolean
  onShowMore?: () => void
}

// Shared token abbreviation logic
const formatTokens = (tokens: number): string => {
  if (tokens >= 1_000_000_000_000) {
    return `${(tokens / 1_000_000_000_000).toFixed(1)}T`
  }
  if (tokens >= 100_000_000_000) {
    return `${(tokens / 1_000_000_000).toFixed(1)}B`
  }
  if (tokens >= 1_000_000_000) {
    return `${(tokens / 1_000_000_000).toFixed(1)}B`
  }
  if (tokens >= 100_000_000) {
    return `${(tokens / 1_000_000).toFixed(0)}M`
  }
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(0)}M`
  }
  if (tokens >= 100_000) {
    return `${(tokens / 1000).toFixed(0)}k`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}k`
  }
  return `${tokens}`
}

// Smart formatting utilities for robust display
const formatters = {
  // Context length with smart abbreviations
  contextLength: (tokens: number): { display: string; full: string } => {
    const fullText = `${tokens.toLocaleString()} tokens`
    const abbreviated = formatTokens(tokens)
    return { display: `${abbreviated} ctx`, full: fullText }
  },

  // Total tokens with support for trillions
  totalTokens: (tokens: number): { display: string; full: string } => {
    const fullText = `${tokens.toLocaleString()} tokens (7d)`
    const abbreviated = formatTokens(tokens)
    return { display: `${abbreviated} tokens (7d)`, full: fullText }
  },

  // Throughput - always integer tokens/sec for easy comparison
  throughput: (tokensPerSec?: number): { display: string; full: string } => {
    if (!tokensPerSec || tokensPerSec === 0) {
      return { display: '— tok/s', full: 'No throughput data available' }
    }

    const fullText = `${tokensPerSec.toFixed(2)} tokens/second`
    const rounded = Math.round(tokensPerSec)

    return { display: `${rounded} tok/s`, full: fullText }
  },

  // Latency - always in seconds with 2 decimal places for consistency
  latency: (milliseconds?: number): { display: string; full: string } => {
    if (!milliseconds || milliseconds === 0) {
      return { display: '— s', full: 'No latency data available' }
    }

    const seconds = milliseconds / 1000
    const fullText = `${milliseconds.toFixed(2)} milliseconds`

    return { display: `${seconds.toFixed(2)}s`, full: fullText }
  },
}

// Specialized pricing component with consistent monospace layout
function PricingValue({
  inputPrice,
  outputPrice,
  className,
}: {
  inputPrice?: number
  outputPrice?: number
  className?: string
}) {
  if (!inputPrice || !outputPrice) {
    // Use dash with spacing to maintain accounting-style alignment
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`${className} cursor-help font-mono whitespace-pre`}>
              {'     '.padStart(5)} • {'     '.padStart(5)} /MTok
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono">No pricing data available</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const inputPerMTok = inputPrice * 1_000_000
  const outputPerMTok = outputPrice * 1_000_000
  const fullText = `Input: $${inputPerMTok.toFixed(6)} per MTok, Output: $${outputPerMTok.toFixed(6)} per MTok`

  // Handle free pricing - visually distinct from missing data
  if (inputPerMTok === 0 && outputPerMTok === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`${className} cursor-help font-mono whitespace-pre`}>
              {'FREE'.padStart(8)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono">Free to use</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Format pricing with consistent spacing
  const formatPrice = (price: number) => {
    if (price >= 1000) return `${(price / 1000).toFixed(2)}k`
    return price.toFixed(2)
  }

  const inputFormatted = `$${formatPrice(inputPerMTok)}`
  const outputFormatted = `$${formatPrice(outputPerMTok)}`

  // Ensure consistent spacing using padding
  const inputPadded = inputFormatted.padStart(5)
  const outputPadded = outputFormatted.padStart(5)

  const displayText = `${inputPadded} • ${outputPadded} /MTok`

  if (displayText.length <= 20) {
    // No truncation needed
    return <div className={`${className} font-mono whitespace-pre`}>{displayText}</div>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${className} cursor-help font-mono whitespace-pre`}>{displayText}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono">{fullText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Tooltip wrapper for truncated values with monospace for numeric data
function MetricValue({
  display,
  full,
  className,
}: {
  display: string
  full: string
  className?: string
}) {
  if (display === full) {
    return <div className={`${className} font-mono`}>{display}</div>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${className} cursor-help font-mono`}>{display}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono">{full}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
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

        const tokensFormatted = totalTokens7d > 0 ? formatters.totalTokens(totalTokens7d) : null

        return (
          <Card key={result.modelId}>
            <CardContent className="">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      <Link
                        href={`/models/${encodeURIComponent(model.slug)}`}
                        className="transition-colors hover:text-primary"
                      >
                        {model.name}
                      </Link>
                    </h3>

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
                    {model.author_name} • Created{' '}
                    {new Date(model.or_created_at).toLocaleDateString()}
                    {tokensFormatted && (
                      <>
                        {' • '}
                        {tokensFormatted.display === tokensFormatted.full ? (
                          <span className="font-mono">{tokensFormatted.display}</span>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help font-mono">
                                  {tokensFormatted.display}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono">{tokensFormatted.full}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </>
                    )}
                  </div>

                  {/* Endpoints */}
                  <div className="space-y-2">
                    {modelEndpoints.map((endpoint) => {
                      // Pre-format all values - always show containers with fallbacks
                      const contextFormatted = formatters.contextLength(endpoint.context_length)
                      const throughputFormatted = formatters.throughput(
                        endpoint.stats?.p50_throughput,
                      )
                      const latencyFormatted = formatters.latency(endpoint.stats?.p50_latency)

                      return (
                        <div
                          key={endpoint._id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{endpoint.provider_name}</span>
                            {endpoint.model_variant !== 'standard' && (
                              <Badge variant="outline" className="text-xs">
                                {endpoint.model_variant}
                              </Badge>
                            )}
                          </div>

                          {/* Always show all metric containers for consistent alignment */}
                          <div className="flex items-center text-sm text-muted-foreground">
                            {/* Context Length */}
                            <MetricValue
                              display={contextFormatted.display}
                              full={contextFormatted.full}
                              className="w-24 truncate text-right"
                            />

                            {/* Throughput - always shown */}
                            <MetricValue
                              display={throughputFormatted.display}
                              full={throughputFormatted.full}
                              className="ml-6 w-28 truncate text-right"
                            />

                            {/* Latency - always shown */}
                            <MetricValue
                              display={latencyFormatted.display}
                              full={latencyFormatted.full}
                              className="ml-6 w-20 truncate text-right"
                            />

                            {/* Pricing - specialized component */}
                            <PricingValue
                              inputPrice={endpoint.pricing.input}
                              outputPrice={endpoint.pricing.output}
                              className="ml-6 w-48 truncate text-right"
                            />
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
              </div>
            </CardContent>
          </Card>
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
