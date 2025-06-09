import { query } from './_generated/server'

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query('models_v1').collect()
    const endpoints = await ctx.db.query('endpoints_v1').collect()

    return models.map((model) => ({
      ...model,
      endpoints: endpoints.filter((e) => e.model_slug === model.slug),
    }))
  },
})

export const getLatestProcessedEpoch = query({
  args: {},
  handler: async (ctx) => {
    // Find the latest epoch from processed models
    const latestModel = await ctx.db.query('models_v1').order('desc').first()

    if (!latestModel) {
      return null
    }

    return latestModel.epoch
  },
})
