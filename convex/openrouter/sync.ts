import { action } from '../_generated/server'
import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { listEndpoints } from './listEndpoints'
import { listModels } from './listModels'
import { transformOrModel, transformOrEndpoint } from './transforms'

/**
 * Synchronizes model and endpoint data from OpenRouter
 * Can sync a specific model, a list of models, or all models
 */
export const syncModels = action({
  args: {
    modelKeys: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let modelKeys: string[] = []

    if (args.modelKeys && args.modelKeys.length > 0) {
      modelKeys = args.modelKeys
    } else {
      const modelsResponse = await listModels()
      modelKeys = modelsResponse.data.map((model) => model.id)
    }

    if (args.limit && args.limit > 0 && args.limit < modelKeys.length) {
      modelKeys = modelKeys.slice(0, args.limit)
    }

    for (const modelKey of modelKeys) {
      try {
        const endpointsResponse = await listEndpoints(modelKey)
        const model = transformOrModel(endpointsResponse)
        const existingModel = await ctx.runQuery(internal.models.getModelByKey, { modelKey: model.modelKey })
        if (!existingModel) {
          await ctx.runMutation(internal.models.insertModel, model)
        } else {
          await ctx.runMutation(internal.models.replaceModel, { ...existingModel, ...model })
        }

        // Endpoints
        const endpoints = endpointsResponse.data.endpoints
        const existingEndpoints = await ctx.runQuery(internal.models.getModelEndpoints, {
          modelKey: model.modelKey,
        })
        const existingByProvider = new Map(existingEndpoints.map((e) => [e.providerName, e]))

        for (const endpoint of endpoints) {
          const modelEndpoint = transformOrEndpoint(endpoint, endpointsResponse.data.id)
          const existing = existingByProvider.get(modelEndpoint.providerName)
          if (!existing) {
            await ctx.runMutation(internal.models.insertEndpoint, modelEndpoint)
          } else {
            await ctx.runMutation(internal.models.replaceEndpoint, { ...existing, ...modelEndpoint })
          }
        }
        console.log(`${modelKey}: ${endpoints.length} endpoints`)
      } catch (error) {
        console.error(`Error syncing ${modelKey}:`, error)
      }
    }
    return null
  },
})
