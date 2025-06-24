import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'

import { query } from './_generated/server'
import { OrAppTokenMetrics } from './or/or_app_token_metrics'
import { OrApps } from './or/or_apps'
import { OrEndpoints } from './or/or_endpoints'
import { OrModelTokenMetrics } from './or/or_model_token_metrics'
import { OrModels } from './or/or_models'

export const getOrModel = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query(OrModels.name)
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
  },
})

export const listOrModels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query(OrModels.name).collect()
  },
})

export const listOrEndpoints = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const endpoints = await ctx.db
      .query(OrEndpoints.name)
      .withIndex('by_model_slug', (q) => q.eq('model_slug', args.slug))
      .collect()

    return asyncMap(endpoints, async (endpoint) => {
      // Find the latest snapshot_at for endpoint metrics
      const latestEndpointMetric = await ctx.db
        .query('or_endpoint_metrics')
        .withIndex('by_endpoint_uuid_snapshot_at', (q) => q.eq('endpoint_uuid', endpoint.uuid))
        .order('desc')
        .first()

      // Get metrics from latest snapshot only
      const metrics = latestEndpointMetric
        ? await ctx.db
            .query('or_endpoint_metrics')
            .withIndex('by_endpoint_uuid_snapshot_at', (q) =>
              q
                .eq('endpoint_uuid', endpoint.uuid)
                .eq('snapshot_at', latestEndpointMetric.snapshot_at),
            )
            .collect()
        : []

      return {
        ...endpoint,
        metrics,
        uptime: await ctx.db
          .query('or_endpoint_uptime_metrics')
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
    const models = await ctx.db.query(OrModels.name).collect()
    const model = models.find((m) => m.slug === args.slug)

    if (!model) return []

    // Find the latest snapshot_at for this model (across all variants)
    const latestMetric = await ctx.db
      .query(OrAppTokenMetrics.name)
      .withIndex('by_permaslug_snapshot_at', (q) => q.eq('model_permaslug', model.permaslug))
      .order('desc')
      .first()

    if (!latestMetric) {
      return []
    }

    // Get all metrics from the latest snapshot (all variants)
    const metrics = await ctx.db
      .query(OrAppTokenMetrics.name)
      .withIndex('by_permaslug_snapshot_at', (q) =>
        q.eq('model_permaslug', model.permaslug).eq('snapshot_at', latestMetric.snapshot_at),
      )
      .collect()

    const apps = await asyncMap(metrics, async (metric) => {
      const app = await ctx.db
        .query(OrApps.name)
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
    const models = await ctx.db.query(OrModels.name).collect()
    const model = models.find((m) => m.slug === args.slug)

    console.log('model', model?.permaslug)
    if (!model) return []

    const n = model.variants.length * 72
    return await ctx.db
      .query(OrModelTokenMetrics.name)
      .withIndex('by_permaslug_timestamp', (q) => q.eq('model_permaslug', model.permaslug))
      .order('desc')
      .take(n)
  },
})
