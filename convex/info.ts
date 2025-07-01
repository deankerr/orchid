import { v } from 'convex/values'
import * as R from 'remeda'

import { internalQuery } from './_generated/server'
import { Entities } from './openrouter/registry'

export const snapshotAppCounts = internalQuery({
  args: { snapshot_at: v.number() },
  handler: async (ctx, { snapshot_at }) => {
    const metrics = await ctx.db
      .query(Entities.appTokenMetrics.table.name)
      .withIndex('by_snapshot_at', (q) => q.eq('snapshot_at', snapshot_at))
      .collect()
    const map = Map.groupBy(metrics, (m) => `${m.model_slug}:${m.model_variant}`)
    const sorted = [...map.entries()].sort((a, b) => b[1].length - a[1].length)
    return sorted.map(([key, value]) => ({
      key,
      value: value.length,
    })) as { key: string; value: number }[]
  },
})

export const modelsWithMultipleEndpoints = internalQuery({
  args: {},

  handler: async (ctx) => {
    // 1. Collect all endpoints
    const allEndpoints = await ctx.db.query(Entities.endpoints.table.name).collect()

    // 2. Filter out "free" variants
    const filteredEndpoints = allEndpoints.filter(
      (endpoint) => endpoint.model_variant === 'standard' && !endpoint.is_disabled,
    )

    // 3. Group by slug
    const groupedBySlug = Map.groupBy(filteredEndpoints, (endpoint) => endpoint.model_slug)

    // 4. Filter out groups with only a single endpoint
    const multipleEndpointGroups = [...groupedBySlug.entries()].filter(
      ([slug, endpoints]) => endpoints.length > 1,
    )

    // 5. Map and get additional data
    const result = []
    for (const [slug, endpoints] of multipleEndpointGroups) {
      const mappedEndpoints = []
      for (const endpoint of endpoints) {
        // Get metrics for the same snapshot_at as the endpoint
        const stats = await ctx.db
          .query(Entities.endpointMetrics.table.name)
          .withIndex('by_endpoint_uuid_snapshot_at', (q) =>
            q.eq('endpoint_uuid', endpoint.uuid).eq('snapshot_at', endpoint.snapshot_at),
          )
          .first()

        // Get uptime data for last 48 hours
        const uptimeMetrics = await ctx.db
          .query(Entities.endpointUptimeMetrics.table.name)
          .withIndex('by_endpoint_uuid_timestamp', (q) => q.eq('endpoint_uuid', endpoint.uuid))
          .order('desc')
          .take(48)

        // Calculate average uptime (filter out undefined values)
        const validUptimes = uptimeMetrics
          .filter((metric) => metric.uptime != null)
          .map((metric) => metric.uptime!)
        const averageUptime =
          validUptimes.length > 0
            ? validUptimes.reduce((sum, uptime) => sum + uptime, 0) / validUptimes.length
            : undefined

        // Combine pricing into single number (input dominates, output is tiny)
        const effectivePricing = endpoint.pricing.input != null ? endpoint.pricing.input : null

        mappedEndpoints.push({
          provider_name: endpoint.provider_name,
          context_length: endpoint.context_length,
          pricing: effectivePricing,
          is_deranked: endpoint.status < 0,
          average_uptime: averageUptime,
          p50_latency_ms: stats?.p50_latency,
          p50_throughput_tokens_per_second: stats?.p50_throughput,
          total_request_count: stats?.request_count,
        })
      }

      // Calculate pricing statistics for this model
      const prices = mappedEndpoints.map((e) => e.pricing).filter((p) => p != null) as number[]

      const pricingStats =
        prices.length > 0
          ? {
              min: parseFloat(Math.min(...prices).toFixed(9)),
              max: parseFloat(Math.max(...prices).toFixed(9)),
              median: parseFloat((R.median(prices) ?? 0).toFixed(9)),
              mean: parseFloat((prices.reduce((sum, p) => sum + p, 0) / prices.length).toFixed(9)),
              spread: parseFloat((Math.max(...prices) - Math.min(...prices)).toFixed(9)),
              count: prices.length,
            }
          : null

      result.push([
        slug,
        {
          endpoints: mappedEndpoints,
          pricing_stats: pricingStats,
        },
      ])
    }

    // Calculate endpoint count distribution
    const endpointCounts = result.map(([slug, data]) => (data as any).endpoints.length)
    const countGroups = R.groupBy(endpointCounts, (count) => count.toString())
    const endpointCountDistribution = R.mapValues(countGroups, (counts) => counts.length)

    return {
      models: Object.fromEntries(result),
      endpoint_count_distribution: endpointCountDistribution,
      total_models: result.length,
      total_endpoints: endpointCounts.reduce((sum, count) => sum + count, 0),
    }
  },
})
