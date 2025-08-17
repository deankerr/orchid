import { v } from 'convex/values'

import { internal } from './_generated/api'
import { internalAction, internalMutation } from './_generated/server'

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

export const clearORTables = internalMutation({
  args: {
    models: v.boolean(),
    endpoints: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.models) {
      const models = await ctx.db.query('or_models').collect()
      for (const model of models) {
        await ctx.db.delete(model._id)
      }
      console.log(`[clearOrTables] deleted ${models.length} models`)
    }

    if (args.endpoints) {
      const endpoints = await ctx.db.query('or_endpoints').collect()
      for (const endpoint of endpoints) {
        await ctx.db.delete(endpoint._id)
      }
      console.log(`[clearOrTables] deleted ${endpoints.length} endpoints`)
    }
  },
})

export const takeSnapshotNow = internalAction({
  handler: async (ctx) => {
    await ctx.runAction(internal.snapshots.crawl.run, {
      apps: true,
      uptimes: true,
      modelAuthors: true,
    })

    await ctx.runAction(internal.snapshots.materialize.materialize.run, {})
  },
})
