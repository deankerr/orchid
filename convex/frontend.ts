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
    const results = await ctx.db.query(Entities.models.table.name).collect()
    return results.map((m) => ({ ...m, description: '' }))
  },
})

export const listOrEndpoints = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query(Entities.endpoints.table.name)
      .withIndex('by_model_slug', (q) => q.eq('model_slug', args.slug))
      .collect()
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
