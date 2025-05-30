import { query } from './_generated/server'

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query('models').collect()
    const endpoints = await ctx.db.query('endpoints').collect()
    return models.map((model) => ({
      ...model,
      endpoints: endpoints.filter((endpoint) => endpoint.modelSlug === model.slug),
    }))
  },
})
