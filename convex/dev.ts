import { internal } from './_generated/api'
import { internalAction, internalMutation, query } from './_generated/server'

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

export const delAllModelEndpoints = internalMutation({
  handler: async (ctx) => {
    const models = await ctx.db.query('or_models').collect()
    const endpoints = await ctx.db.query('or_endpoints').collect()
    models.forEach(async (m) => {
      await ctx.db.delete(m._id)
    })
    endpoints.forEach(async (e) => {
      await ctx.db.delete(e._id)
    })
  },
})

export const runAllCrawl = internalAction({
  handler: async (ctx) => {
    await ctx.runAction(internal.snapshots_v3.crawl.run, {
      apps: true,
      endpoints: true,
      models: true,
      providers: true,
      uptimes: true,
      modelAuthors: true,
    })
  },
})
