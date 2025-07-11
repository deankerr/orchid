import { internalMutation } from './_generated/server'

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
