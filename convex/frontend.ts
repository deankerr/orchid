import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'

import { query } from './_generated/server'
import { OrEndpoints } from './or/or_endpoints'
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

    return asyncMap(endpoints, async (endpoint) => ({
      ...endpoint,
      metrics: await ctx.db
        .query('or_endpoint_metrics')
        .withIndex('by_endpoint_uuid_snapshot_at', (q) => q.eq('endpoint_uuid', endpoint.uuid))
        .order('desc')
        .take(7),
      uptime: await ctx.db
        .query('or_endpoint_uptime_metrics')
        .withIndex('by_endpoint_uuid_timestamp', (q) => q.eq('endpoint_uuid', endpoint.uuid))
        .order('desc')
        .take(72),
    }))
  },
})
