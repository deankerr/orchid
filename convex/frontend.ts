import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'

import { query } from './_generated/server'
import { Entities } from './openrouter/registry'

export const getOrModel = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query(Entities.models.table.name)
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
  },
})

export const listOrModels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query(Entities.models.table.name).collect()
  },
})

export const listOrEndpoints = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const endpoints = await ctx.db
      .query(Entities.endpoints.table.name)
      .withIndex('by_model_slug', (q) => q.eq('model_slug', args.slug))
      .collect()

    return asyncMap(endpoints, async (endpoint) => {
      const metrics = await ctx.db
        .query(Entities.endpointMetrics.table.name)
        .withIndex('by_endpoint_uuid_snapshot_at', (q) =>
          q.eq('endpoint_uuid', endpoint.uuid).eq('snapshot_at', endpoint.snapshot_at),
        )
        .order('desc')
        .first()

      const { p50_throughput, p50_latency, request_count } = metrics ?? {}
      return {
        ...endpoint,
        metrics: {
          p50_throughput,
          p50_latency,
          request_count,
        },
        uptime: await ctx.db
          .query(Entities.endpointUptimeMetrics.table.name)
          .withIndex('by_endpoint_uuid_timestamp', (q) => q.eq('endpoint_uuid', endpoint.uuid))
          .order('desc')
          .take(72),
      }
    })
  },
})

export const getOrTopAppsForModel = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const models = await ctx.db.query(Entities.models.table.name).collect()
    const model = models.find((m) => m.slug === args.slug)

    if (!model) return []

    // Find the latest snapshot_at for this model (across all variants)
    const latestMetric = await ctx.db
      .query(Entities.appTokenMetrics.table.name)
      .withIndex('by_permaslug_snapshot_at', (q) => q.eq('model_permaslug', model.permaslug))
      .order('desc')
      .first()

    if (!latestMetric) {
      return []
    }

    // Get all metrics from the latest snapshot (all variants)
    const metrics = await ctx.db
      .query(Entities.appTokenMetrics.table.name)
      .withIndex('by_permaslug_snapshot_at', (q) =>
        q.eq('model_permaslug', model.permaslug).eq('snapshot_at', latestMetric.snapshot_at),
      )
      .collect()

    const apps = await asyncMap(metrics, async (metric) => {
      const app = await ctx.db
        .query(Entities.apps.table.name)
        .withIndex('by_app_id', (q) => q.eq('app_id', metric.app_id))
        .first()

      return {
        metric,
        app,
      }
    })

    return apps.sort((a, b) => b.metric.total_tokens - a.metric.total_tokens)
  },
})

export const getOrModelTokenMetrics = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const models = await ctx.db.query(Entities.models.table.name).collect()
    const model = models.find((m) => m.slug === args.slug)

    if (!model) return []

    const n = model.variants.length * 72
    return await ctx.db
      .query(Entities.modelTokenMetrics.table.name)
      .withIndex('by_permaslug_timestamp', (q) => q.eq('model_permaslug', model.permaslug))
      .order('desc')
      .take(n)
  },
})

export const listOrProviders = query({
  args: {},
  handler: async (ctx) => {
    const providers = await ctx.db.query(Entities.providers.table.name).collect()
    return providers.sort((a, b) => a.name.localeCompare(b.name))
  },
})
