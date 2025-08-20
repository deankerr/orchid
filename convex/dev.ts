import { v } from 'convex/values'

import { internal } from './_generated/api'
import { internalAction, internalMutation } from './_generated/server'

export const sizes = internalMutation({
  returns: v.null(),
  handler: async (ctx) => {
    const m = await ctx.db.query('or_models').collect()
    const ms = new TextEncoder().encode(JSON.stringify(m)).length

    const e = await ctx.db.query('or_endpoints').collect()
    const es = new TextEncoder().encode(JSON.stringify(e)).length

    console.log({
      models: m.length,
      modelsSizeKb: ms / 1024,
      modelsAvgSizeKb: ms / m.length / 1024,
      endpoints: e.length,
      endpointsSizeKb: es / 1024,
      endpointsAvgSizeKb: es / e.length / 1024,
    })
  },
})

export const clearORTables = internalMutation({
  args: {
    models: v.boolean(),
    endpoints: v.boolean(),
  },
  returns: v.null(),
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
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runAction(internal.snapshots.crawl.run, {
      apps: true,
      uptimes: true,
      modelAuthors: true,
    })

    await ctx.runAction(internal.snapshots.materialize.materialize.run, {})
  },
})

export const deleteAllChanges = internalAction({
  handler: async (ctx) => {
    // Clear or_endpoint_changes
    while (true) {
      const deleted: number = await ctx.runMutation(internal.db.or.endpointChanges.clearTable)
      if (deleted === 0) break
    }
    // Clear or_model_changes
    while (true) {
      const deleted: number = await ctx.runMutation(internal.db.or.modelChanges.clearTable)
      if (deleted === 0) break
    }
    // Clear or_provider_changes
    while (true) {
      const deleted: number = await ctx.runMutation(internal.db.or.providerChanges.clearTable)
      if (deleted === 0) break
    }
  },
})
