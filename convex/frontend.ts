import { query } from './_generated/server'
import { EndpointViews } from './endpoint_views/table'
import { ModelViews } from './model_views/table'

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query(ModelViews.name).collect()
    const endpoints = await ctx.db.query(EndpointViews.name).collect()

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
    const latestModel = await ctx.db.query(ModelViews.name).order('desc').first()

    if (!latestModel) {
      return null
    }

    return latestModel.epoch
  },
})
