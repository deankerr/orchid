import { v } from 'convex/values'

import { internalMutation, query } from './_generated/server'

export const sizes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const m = await ctx.db.query('or_models').collect()
    const ms = new TextEncoder().encode(
      JSON.stringify(m.map((m) => ({ ...m, description: '' }))),
    ).length

    const e = await ctx.db.query('or_endpoints').collect()
    const es = new TextEncoder().encode(JSON.stringify(e)).length

    return {
      models: m.length,
      modelsSizeKb: ms / 1024,
      modelsAvgSizeKb: ms / m.length / 1024,
      endpoints: e.length,
      endpointsSizeKb: es / 1024,
      endpointsAvgSizeKb: es / e.length / 1024,
    }
  },
})

export const authorSlugCounts = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query('or_models').collect()
    const counts: Record<string, number> = {}
    for (const m of models) {
      counts[m.author_slug] = (counts[m.author_slug] || 0) + 1
    }
    return Object.entries(counts)
      .map(([author_slug, count]) => ({ author_slug, count }))
      .sort((a, b) => b.count - a.count)
  },
})
