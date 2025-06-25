'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatTokenPriceToM } from '@/lib/utils'

interface EndpointData {
  context_length: number
  is_deranked: boolean
  pricing: number
  provider_name: string
  average_uptime?: number
  p50_latency_ms?: number
  p50_throughput_tokens_per_second?: number
  total_request_count?: number
}

interface ModelData {
  endpoints: EndpointData[]
  pricing_stats: {
    count: number
    max: number
    mean: number
    median: number
    min: number
    spread: number
  }
}

interface ModelListItemProps {
  slug: string
  model: ModelData
}

export function ModelListItem({ slug, model }: ModelListItemProps) {
  // Calculate traffic and routing insights
  const totalRequests = model.endpoints.reduce((sum, ep) => sum + (ep.total_request_count || 0), 0)
  const activeEndpoints = model.endpoints.filter((ep) => (ep.total_request_count || 0) > 0)
  const derankedCount = model.endpoints.filter((ep) => ep.is_deranked).length

  // Sort endpoints by traffic
  const sortedByTraffic = activeEndpoints
    .sort((a, b) => (b.total_request_count || 0) - (a.total_request_count || 0))
    .slice(0, 3)

  // Calculate pricing insights
  const priceVariation =
    model.pricing_stats.min > 0
      ? Math.round((model.pricing_stats.spread / model.pricing_stats.min) * 100)
      : 0

  // Find best performance endpoints
  const highThroughputEndpoints = model.endpoints.filter(
    (ep) => ep.p50_throughput_tokens_per_second && ep.p50_throughput_tokens_per_second > 1000,
  ).length

  // Calculate traffic concentration
  const topProviderShare =
    activeEndpoints.length > 0
      ? (Math.max(...activeEndpoints.map((ep) => ep.total_request_count || 0)) / totalRequests) *
        100
      : 0

  // Popular choice pricing (traffic-weighted average)
  const popularPrice =
    activeEndpoints.length > 0
      ? activeEndpoints.reduce((sum, ep) => sum + ep.pricing * (ep.total_request_count || 0), 0) /
        totalRequests
      : model.pricing_stats.mean

  // Performance metrics
  const avgThroughput = activeEndpoints
    .filter((ep) => ep.p50_throughput_tokens_per_second)
    .reduce((sum, ep, _, arr) => sum + (ep.p50_throughput_tokens_per_second || 0) / arr.length, 0)

  const avgLatency = activeEndpoints
    .filter((ep) => ep.p50_latency_ms)
    .reduce((sum, ep, _, arr) => sum + (ep.p50_latency_ms || 0) / arr.length, 0)

  // Complexity indicators
  const isComplex = model.endpoints.length >= 5
  const hasPerformanceTier = highThroughputEndpoints > 0
  const isHighVariation = priceVariation > 100

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-3 p-4">
        {/* Header with model name and key indicators */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm font-medium">{slug}</code>
              {isComplex && (
                <Badge variant="outline" className="text-xs">
                  Complex
                </Badge>
              )}
              {hasPerformanceTier && (
                <Badge variant="secondary" className="text-xs">
                  Ultra-fast
                </Badge>
              )}
              {derankedCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {derankedCount} Deranked
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
              <span>{model.endpoints.length} endpoints</span>
              {totalRequests > 0 && <span>{(totalRequests / 1000000).toFixed(1)}M requests</span>}
              {activeEndpoints.length !== model.endpoints.length && (
                <span>{activeEndpoints.length} active</span>
              )}
            </div>
          </div>

          {/* Traffic concentration indicator */}
          {activeEndpoints.length > 1 && (
            <div className="space-y-1 text-right">
              <div className="font-mono text-xs text-muted-foreground">Traffic Concentration</div>
              <div className="flex items-center gap-2">
                <Progress value={topProviderShare} className="h-2 w-16" />
                <span
                  className={`font-mono text-xs font-bold ${
                    topProviderShare > 70
                      ? 'text-red-500'
                      : topProviderShare > 50
                        ? 'text-yellow-500'
                        : 'text-green-500'
                  }`}
                >
                  {topProviderShare.toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pricing section */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-mono text-xs text-muted-foreground">Cheapest</div>
            <div className="font-mono font-bold">
              {formatTokenPriceToM(model.pricing_stats.min)}
            </div>
          </div>
          <div>
            <div className="font-mono text-xs text-muted-foreground">Popular Choice</div>
            <div className="font-mono font-bold text-blue-600">
              {formatTokenPriceToM(popularPrice)}
            </div>
            {Math.abs(popularPrice - model.pricing_stats.min) / model.pricing_stats.min > 0.1 && (
              <div className="font-mono text-xs text-orange-500">
                +
                {(
                  ((popularPrice - model.pricing_stats.min) / model.pricing_stats.min) *
                  100
                ).toFixed(0)}
                %
              </div>
            )}
          </div>
          <div>
            <div className="font-mono text-xs text-muted-foreground">Range</div>
            <div className="font-mono font-bold">
              {formatTokenPriceToM(model.pricing_stats.min)} -{' '}
              {formatTokenPriceToM(model.pricing_stats.max)}
            </div>
            {isHighVariation && (
              <div className="font-mono text-xs text-red-500">{priceVariation}% variation</div>
            )}
          </div>
          <div>
            <div className="font-mono text-xs text-muted-foreground">Context</div>
            <div className="font-mono font-bold">
              {Math.max(...model.endpoints.map((ep) => ep.context_length)).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Performance metrics */}
        {(avgThroughput > 0 || avgLatency > 0) && (
          <div className="grid grid-cols-3 gap-4 border-t pt-3 text-sm">
            {avgThroughput > 0 && (
              <div>
                <div className="font-mono text-xs text-muted-foreground">Avg Throughput</div>
                <div
                  className={`font-mono font-bold ${avgThroughput > 1000 ? 'text-green-600' : avgThroughput > 100 ? 'text-blue-600' : ''}`}
                >
                  {avgThroughput.toFixed(0)} tok/s
                </div>
              </div>
            )}
            {avgLatency > 0 && (
              <div>
                <div className="font-mono text-xs text-muted-foreground">Avg Latency</div>
                <div className="font-mono font-bold">{avgLatency.toFixed(0)}ms</div>
              </div>
            )}
            {activeEndpoints.length > 0 && (
              <div>
                <div className="font-mono text-xs text-muted-foreground">Best Value</div>
                <div className="font-mono font-bold text-green-600">
                  {Math.max(
                    ...activeEndpoints
                      .filter((ep) => ep.p50_throughput_tokens_per_second)
                      .map(
                        (ep) => (ep.p50_throughput_tokens_per_second || 0) / (ep.pricing * 1000000),
                      ),
                  ).toFixed(1)}{' '}
                  tok/s/$
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top providers section */}
        {sortedByTraffic.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <div className="font-mono text-xs font-medium text-muted-foreground">
              Traffic Leaders
            </div>
            <div className="space-y-1">
              {sortedByTraffic.map((endpoint, i) => {
                const trafficShare = ((endpoint.total_request_count || 0) / totalRequests) * 100
                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{endpoint.provider_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {trafficShare.toFixed(1)}%
                      </Badge>
                      {endpoint.is_deranked && (
                        <Badge variant="destructive" className="text-xs">
                          DERANKED
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                      <span>{formatTokenPriceToM(endpoint.pricing)}</span>
                      {endpoint.p50_throughput_tokens_per_second &&
                        endpoint.p50_throughput_tokens_per_second > 500 && (
                          <span className="text-green-600">
                            {endpoint.p50_throughput_tokens_per_second.toFixed(0)} tok/s
                          </span>
                        )}
                      {endpoint.p50_latency_ms && (
                        <span>{endpoint.p50_latency_ms.toFixed(0)}ms</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Insights footer */}
        {(isComplex || hasPerformanceTier || isHighVariation) && (
          <div className="border-t pt-3">
            <div className="flex flex-wrap gap-2 text-xs">
              {isHighVariation && (
                <div className="font-mono text-orange-600">
                  ⚠️ Showing only cheapest price ({formatTokenPriceToM(model.pricing_stats.min)})
                  would be misleading
                </div>
              )}
              {hasPerformanceTier && (
                <div className="font-mono text-green-600">
                  ⚡ Ultra-fast options available ({highThroughputEndpoints} endpoints {'>'}1000
                  tok/s)
                </div>
              )}
              {topProviderShare > 80 && activeEndpoints.length > 2 && (
                <div className="font-mono text-blue-600">
                  🎯 {topProviderShare.toFixed(0)}% of traffic goes to{' '}
                  {sortedByTraffic[0]?.provider_name}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
