import { query } from './_generated/server'
import { OrEndpoints } from './or/or_endpoints'
import { OrModels } from './or/or_models'

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query(OrModels.name).collect()
    const endpoints = await ctx.db.query(OrEndpoints.name).collect()

    return models.map((model) => ({
      ...model,
      endpoints: endpoints.filter((e) => e.model_slug === model.slug),
    }))
  },
})

export const getLatestProcessedSnapshotAt = query({
  args: {},
  handler: async (ctx) => {
    // Find the latest epoch from processed models
    const latestModel = await ctx.db.query(OrModels.name).order('desc').first()

    if (!latestModel) {
      return null
    }

    return latestModel.snapshot_at
  },
})
