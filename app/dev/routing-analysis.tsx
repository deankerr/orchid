'use client'

// Import the actual data
import endpointsData from '@/app/dev/endpoints-data.json'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

// Process the real data
const models = Object.entries(endpointsData.models as Record<string, ModelData>)

// High-endpoint models (9+)
const highEndpointModels = models
  .filter(([_, model]) => model.endpoints.length >= 9)
  .sort((a, b) => b[1].endpoints.length - a[1].endpoints.length)
  .map(([slug, model]) => {
    const totalRequests = model.endpoints.reduce(
      (sum, ep) => sum + (ep.total_request_count || 0),
      0,
    )
    const sortedByTraffic = model.endpoints
      .filter((ep) => (ep.total_request_count || 0) > 0)
      .sort((a, b) => (b.total_request_count || 0) - (a.total_request_count || 0))
      .slice(0, 5)

    return {
      slug,
      endpointCount: model.endpoints.length,
      totalRequests,
      priceRange: {
        min: model.pricing_stats.min,
        max: model.pricing_stats.max,
        variation:
          model.pricing_stats.min > 0
            ? Math.round((model.pricing_stats.spread / model.pricing_stats.min) * 100)
            : 0,
      },
      topEndpoints: sortedByTraffic.map((ep) => ({
        provider: ep.provider_name,
        traffic: totalRequests > 0 ? ((ep.total_request_count || 0) / totalRequests) * 100 : 0,
        requests: ep.total_request_count || 0,
        price: ep.pricing,
        uptime: ep.average_uptime || 0,
        latency: ep.p50_latency_ms || 0,
        throughput: ep.p50_throughput_tokens_per_second || 0,
        deranked: ep.is_deranked,
      })),
    }
  })

// Provider analysis with much more data
const providerStats = models.reduce(
  (acc, [_, model]) => {
    model.endpoints.forEach((ep) => {
      if (!acc[ep.provider_name]) {
        acc[ep.provider_name] = {
          endpoints: 0,
          totalRequests: 0,
          prices: [],
          throughputs: [],
          uptimes: [],
          derankedCount: 0,
        }
      }
      acc[ep.provider_name].endpoints++
      acc[ep.provider_name].totalRequests += ep.total_request_count || 0
      acc[ep.provider_name].prices.push(ep.pricing)
      if (ep.p50_throughput_tokens_per_second)
        acc[ep.provider_name].throughputs.push(ep.p50_throughput_tokens_per_second)
      if (ep.average_uptime) acc[ep.provider_name].uptimes.push(ep.average_uptime)
      if (ep.is_deranked) acc[ep.provider_name].derankedCount++
    })
    return acc
  },
  {} as Record<string, any>,
)

const providerAnalysis = Object.entries(providerStats)
  .filter(([_, stats]) => stats.endpoints >= 3) // Only providers with 3+ endpoints
  .sort((a, b) => b[1].totalRequests - a[1].totalRequests)
  .slice(0, 15) // Top 15 providers
  .map(([provider, stats]) => ({
    provider,
    endpoints: stats.endpoints,
    totalRequests: stats.totalRequests,
    avgPrice: stats.prices.reduce((a: number, b: number) => a + b, 0) / stats.prices.length,
    avgThroughput:
      stats.throughputs.length > 0
        ? stats.throughputs.reduce((a: number, b: number) => a + b, 0) / stats.throughputs.length
        : 0,
    avgUptime:
      stats.uptimes.length > 0
        ? stats.uptimes.reduce((a: number, b: number) => a + b, 0) / stats.uptimes.length
        : 0,
    derankedPct: (stats.derankedCount / stats.endpoints) * 100,
  }))

// Price vs Performance analysis
const pricePerformanceData = models
  .flatMap(([slug, model]) =>
    model.endpoints
      .filter(
        (ep) =>
          ep.total_request_count &&
          ep.total_request_count > 100 &&
          ep.p50_throughput_tokens_per_second,
      )
      .map((ep) => ({
        model: slug.split('/').pop() || slug,
        provider: ep.provider_name,
        price: ep.pricing,
        throughput: ep.p50_throughput_tokens_per_second || 0,
        requests: ep.total_request_count || 0,
        pricePerformance: ep.pricing / (ep.p50_throughput_tokens_per_second || 1),
        uptime: ep.average_uptime || 0,
        deranked: ep.is_deranked,
      })),
  )
  .sort((a, b) => a.pricePerformance - b.pricePerformance)

// Traffic concentration analysis
const trafficByModel = models
  .map(([slug, model]) => ({
    slug,
    totalRequests: model.endpoints.reduce((sum, ep) => sum + (ep.total_request_count || 0), 0),
    endpointCount: model.endpoints.length,
    topProviderShare:
      model.endpoints.length > 1
        ? (Math.max(...model.endpoints.map((ep) => ep.total_request_count || 0)) /
            model.endpoints.reduce((sum, ep) => sum + (ep.total_request_count || 0), 0)) *
          100
        : 100,
  }))
  .filter((m) => m.totalRequests > 1000)
  .sort((a, b) => b.totalRequests - a.totalRequests)
  .slice(0, 20)

export function RoutingAnalysis() {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="font-mono text-2xl font-bold">OpenRouter Routing Analysis</h1>
        <p className="font-mono text-sm text-muted-foreground">
          Comprehensive analysis of {models.length} models across{' '}
          {Object.keys(providerStats).length} providers
        </p>
      </div>

      <Tabs defaultValue="high-endpoint" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="high-endpoint">High-Endpoint Models</TabsTrigger>
          <TabsTrigger value="provider-analysis">Provider Performance</TabsTrigger>
          <TabsTrigger value="price-performance">Price vs Performance</TabsTrigger>
          <TabsTrigger value="traffic-concentration">Traffic Patterns</TabsTrigger>
          <TabsTrigger value="distribution">Endpoint Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="high-endpoint" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">
                Models with 9+ Endpoints ({highEndpointModels.length} total)
              </CardTitle>
              <CardDescription>
                Complex routing patterns where cheapest != most used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {highEndpointModels.map((model) => (
                <div key={model.slug} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                      {model.slug}
                    </code>
                    <div className="flex gap-2">
                      <Badge variant="outline">{model.endpointCount} endpoints</Badge>
                      <Badge variant="outline">{model.priceRange.variation}% variation</Badge>
                      <Badge variant="outline">
                        {(model.totalRequests / 1000).toFixed(0)}K requests
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-mono text-muted-foreground">Price Range</div>
                      <div className="font-mono font-bold">
                        {formatTokenPriceToM(model.priceRange.min)} -{' '}
                        {formatTokenPriceToM(model.priceRange.max)}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-muted-foreground">Total Traffic</div>
                      <div className="font-mono font-bold">
                        {(model.totalRequests / 1000000).toFixed(1)}M requests
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-muted-foreground">Top Provider</div>
                      <div className="font-mono font-bold">
                        {model.topEndpoints[0]?.provider || 'N/A'} (
                        {model.topEndpoints[0]?.traffic.toFixed(1) || 0}%)
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-muted-foreground">Active Endpoints</div>
                      <div className="font-mono font-bold">
                        {model.topEndpoints.length}/{model.endpointCount}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-mono text-sm font-medium">Traffic Leaders:</div>
                    {model.topEndpoints.slice(0, 5).map((endpoint, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-l-2 border-muted pl-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-medium">{endpoint.provider}</span>
                          <Badge variant="secondary">{endpoint.traffic.toFixed(1)}%</Badge>
                          {endpoint.deranked && <Badge variant="destructive">DERANKED</Badge>}
                        </div>
                        <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
                          <span>{formatTokenPriceToM(endpoint.price)}</span>
                          <span>{endpoint.requests.toLocaleString()} reqs</span>
                          {endpoint.throughput > 0 && (
                            <span className="text-green-600">
                              {endpoint.throughput.toFixed(0)} tok/s
                            </span>
                          )}
                          {endpoint.latency > 0 && <span>{endpoint.latency.toFixed(0)}ms</span>}
                          {endpoint.uptime > 0 && <span>{endpoint.uptime.toFixed(1)}% up</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provider-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Provider Performance Metrics</CardTitle>
              <CardDescription>Top 15 providers by traffic volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {providerAnalysis.map((provider) => (
                  <div
                    key={provider.provider}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="font-mono font-medium">{provider.provider}</div>
                      <div className="flex gap-4 font-mono text-xs text-muted-foreground">
                        <span>{provider.endpoints} endpoints</span>
                        {provider.derankedPct > 0 && (
                          <span className="text-red-500">
                            {provider.derankedPct.toFixed(0)}% deranked
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 font-mono text-sm">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Requests</div>
                        <div className="font-bold">
                          {(provider.totalRequests / 1000000).toFixed(1)}M
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Avg Price</div>
                        <div className="font-bold">{formatTokenPriceToM(provider.avgPrice)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Throughput</div>
                        <div className="font-bold">
                          {provider.avgThroughput > 0
                            ? `${provider.avgThroughput.toFixed(0)} tok/s`
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Uptime</div>
                        <div className="font-bold">
                          {provider.avgUptime > 0 ? `${provider.avgUptime.toFixed(1)}%` : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Value Score</div>
                        <div className="font-bold">
                          {provider.avgThroughput > 0
                            ? (provider.avgThroughput / (provider.avgPrice * 1000000)).toFixed(1)
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="price-performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Price vs Performance Analysis</CardTitle>
              <CardDescription>Best value endpoints (price per token/second)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <ScatterChart data={pricePerformanceData.slice(0, 100)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="throughput"
                    type="number"
                    scale="log"
                    domain={['dataMin', 'dataMax']}
                    label={{
                      value: 'Throughput (tok/s, log scale)',
                      position: 'insideBottom',
                      offset: -5,
                    }}
                  />
                  <YAxis
                    dataKey="price"
                    type="number"
                    scale="log"
                    domain={['dataMin', 'dataMax']}
                    label={{ value: 'Price (log scale)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => formatTokenPriceToM(value)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-lg">
                            <div className="font-mono font-medium">{data.model}</div>
                            <div className="font-mono text-sm text-muted-foreground">
                              {data.provider}
                            </div>
                            <div className="space-y-1 font-mono text-sm">
                              <div>Price: {formatTokenPriceToM(data.price)}</div>
                              <div>Throughput: {data.throughput.toFixed(0)} tok/s</div>
                              <div>Requests: {data.requests.toLocaleString()}</div>
                              <div>
                                Value: {(data.throughput / (data.price * 1000000)).toFixed(1)} tok/s
                                per $
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Scatter dataKey="price">
                    {pricePerformanceData.slice(0, 100).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.deranked
                            ? '#ef4444'
                            : entry.throughput > 1000
                              ? '#22c55e'
                              : entry.throughput > 100
                                ? '#3b82f6'
                                : '#6b7280'
                        }
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="mt-2 font-mono text-xs text-muted-foreground">
                🟢 Ultra-fast ({'>'}1000 tok/s) • 🔵 Fast ({'>'}100 tok/s) • ⚪ Standard • 🔴
                Deranked
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Best Value Endpoints</CardTitle>
              <CardDescription>Highest throughput per dollar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pricePerformanceData.slice(0, 20).map((endpoint, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded border p-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium">{endpoint.model}</span>
                      <span className="font-mono text-muted-foreground">{endpoint.provider}</span>
                      {endpoint.deranked && (
                        <Badge variant="destructive" className="text-xs">
                          DERANKED
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 font-mono text-xs">
                      <span>{formatTokenPriceToM(endpoint.price)}</span>
                      <span>{endpoint.throughput.toFixed(0)} tok/s</span>
                      <span className="font-bold text-green-600">
                        {(endpoint.throughput / (endpoint.price * 1000000)).toFixed(1)} tok/s/$
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic-concentration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Traffic Concentration by Model</CardTitle>
              <CardDescription>
                How traffic distributes across providers for top models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trafficByModel.map((model, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded border p-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium">{model.slug.split('/').pop()}</span>
                      <Badge variant="outline" className="text-xs">
                        {model.endpointCount} endpoints
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-xs">
                      <span>{(model.totalRequests / 1000000).toFixed(1)}M requests</span>
                      <span
                        className={`font-bold ${model.topProviderShare > 70 ? 'text-red-500' : model.topProviderShare > 50 ? 'text-yellow-500' : 'text-green-500'}`}
                      >
                        {model.topProviderShare.toFixed(0)}% concentrated
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Endpoint Count Distribution</CardTitle>
              <CardDescription>
                {models.filter(([_, m]) => m.endpoints.length <= 4).length} models have simple
                pricing (≤4 endpoints)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(endpointsData.endpoint_count_distribution).map(
                    ([count, models]) => ({
                      endpointCount: parseInt(count),
                      modelCount: models,
                    }),
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="endpointCount" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload[0]) {
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-lg">
                            <div className="font-mono font-medium">{label} endpoints</div>
                            <div className="font-mono text-sm">{payload[0].value} models</div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="modelCount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
