import { paginationOptsValidator, type WithoutSystemFields } from 'convex/server'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { internalMutation, internalQuery, query } from './_generated/server'
import { asyncMap } from 'convex-helpers'

export const insertModel = internalMutation({
  handler: async (ctx, args: WithoutSystemFields<Doc<'models'>>) => {
    return await ctx.db.insert('models', args)
  },
})

export const replaceModel = internalMutation({
  handler: async (ctx, args: Doc<'models'>) => {
    await ctx.db.replace(args._id, args)
    return args._id
  },
})

export const insertEndpoint = internalMutation({
  handler: async (ctx, args: WithoutSystemFields<Doc<'modelEndpoints'>>) => {
    return await ctx.db.insert('modelEndpoints', args)
  },
})

export const replaceEndpoint = internalMutation({
  handler: async (ctx, args: Doc<'modelEndpoints'>) => {
    await ctx.db.replace(args._id, args)
    return args._id
  },
})

export const getModel = internalQuery({
  args: { modelKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('models')
      .withIndex('by_modelKey', (q) => q.eq('modelKey', args.modelKey))
      .unique()
  },
})

export const getModelEndpoints = internalQuery({
  args: {
    modelKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('modelEndpoints')
      .withIndex('by_modelKey', (q) => q.eq('modelKey', args.modelKey))
      .collect()
  },
})

export const listModelsWithEndpoints = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const models = await ctx.db.query('models').paginate(args.paginationOpts)

    return {
      ...models,
      page: await asyncMap(models.page, async (model) => {
        const endpoints = await ctx.db
          .query('modelEndpoints')
          .withIndex('by_modelKey', (q) => q.eq('modelKey', model.modelKey))
          .collect()
        return {
          ...model,
          endpoints,
        }
      }),
    }
  },
})

export const getModelWithEndpoints = query({
  args: {
    modelKey: v.string(),
  },
  handler: async (ctx, args) => {
    const model = await ctx.db
      .query('models')
      .withIndex('by_modelKey', (q) => q.eq('modelKey', args.modelKey))
      .unique()

    if (!model) {
      return null
    }

    const endpoints = await ctx.db
      .query('modelEndpoints')
      .withIndex('by_modelKey', (q) => q.eq('modelKey', args.modelKey))
      .collect()
    return {
      ...model,
      endpoints,
    }
  },
})
// Query to find endpoints with specific capabilities
export const findEndpointsByCapabilities = query({
  args: {
    supportsImages: v.optional(v.boolean()),
    supportsTools: v.optional(v.boolean()),
    supportsStructuredOutputs: v.optional(v.boolean()),
    providerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all endpoints
    const endpoints = await ctx.db.query('modelEndpoints').collect()

    // Get all models
    const models = await ctx.db.query('models').collect()

    // Create a lookup map for models
    const modelMap = new Map()
    for (const model of models) {
      modelMap.set(model.modelKey, model)
    }

    // Filter endpoints based on capabilities
    const results = []

    for (const endpoint of endpoints) {
      const model = modelMap.get(endpoint.modelKey)
      if (!model) continue

      // Filter by provider if specified
      if (args.providerName && endpoint.providerName !== args.providerName) {
        continue
      }

      // Filter by image support
      if (args.supportsImages && !model.architecture.inputModalities.includes('image')) {
        continue
      }

      // Filter by tools support
      if (args.supportsTools && !endpoint.supportedParameters.includes('tools')) {
        continue
      }

      // Filter by structured outputs support
      if (args.supportsStructuredOutputs && !endpoint.supportedParameters.includes('structured_outputs')) {
        continue
      }

      results.push({
        endpoint,
        model,
      })
    }

    return results
  },
})
