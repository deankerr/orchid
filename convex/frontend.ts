import { query } from './_generated/server'

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    // Get all models ordered by slug
    const models = await ctx.db.query('models').order('asc').collect()

    // Get all endpoints and group by modelSlug
    const endpoints = await ctx.db.query('endpoints').collect()
    const endpointsByModel = new Map<string, typeof endpoints>()

    for (const endpoint of endpoints) {
      const existing = endpointsByModel.get(endpoint.modelSlug) || []
      existing.push(endpoint)
      endpointsByModel.set(endpoint.modelSlug, existing)
    }

    // Combine models with their endpoints
    return models.map((model) => ({
      ...model,
      endpoints: endpointsByModel.get(model.slug) || [],
    }))
  },
})
