import { v } from 'convex/values'

import { diff } from 'json-diff-ts'

import { db } from '@/convex/db'

import { internalMutation } from '../../_generated/server'

const vUpsertModel = db.or.views.models.vTable.validator.omit('updated_at')
const vUpsertEndpoint = db.or.views.endpoints.vTable.validator.omit('updated_at')
const vUpsertProvider = db.or.views.providers.vTable.validator.omit('updated_at')

function isEqual(from: Record<string, unknown>, to: Record<string, unknown>) {
  const changes = diff(from, to, {
    keysToSkip: ['_id', '_creationTime', 'updated_at'],
  })
  return changes.length === 0
}

export const upsert = internalMutation({
  args: {
    models: vUpsertModel.array(),
    endpoints: vUpsertEndpoint.array(),
    providers: vUpsertProvider.array(),
    crawl_id: v.string(),
  },
  handler: async (ctx, args) => {
    // * initialize counters
    const counters = {
      models: { stable: 0, update: 0, insert: 0, unavailable: 0 },
      endpoints: { stable: 0, update: 0, insert: 0, unavailable: 0 },
      providers: { stable: 0, update: 0, insert: 0, unavailable: 0 },
    }

    // * models
    const currentModels = await db.or.views.models.collect(ctx)
    const currentModelsMap = new Map(currentModels.map((m) => [m.slug, m]))

    for (const model of args.models) {
      const currentModel = currentModelsMap.get(model.slug)

      if (currentModel) {
        currentModelsMap.delete(currentModel.slug)

        if (isEqual(currentModel, model)) {
          // * stable
          counters.models.stable++
        } else {
          // * update
          await db.or.views.models.replace(ctx, currentModel._id, model)
          counters.models.update++
        }
      } else {
        // * insert
        await db.or.views.models.insert(ctx, model)
        counters.models.insert++
      }
    }

    // update unavailable_at for models that are no longer advertised
    for (const currentModel of currentModelsMap.values()) {
      // * only set unavailable_at once when entity first becomes unavailable
      if (currentModel.unavailable_at === undefined) {
        await db.or.views.models.patch(ctx, currentModel._id, {
          unavailable_at: parseInt(args.crawl_id),
        })
        counters.models.unavailable++
      }
    }

    // * endpoints
    const currentEndpoints = await db.or.views.endpoints.collect(ctx)
    const currentEndpointsMap = new Map(currentEndpoints.map((e) => [e.uuid, e]))

    for (const endpoint of args.endpoints) {
      const currentEndpoint = currentEndpointsMap.get(endpoint.uuid)

      if (currentEndpoint) {
        currentEndpointsMap.delete(currentEndpoint.uuid)

        if (isEqual(currentEndpoint, endpoint)) {
          // * stable
          counters.endpoints.stable++
        } else {
          // * update
          await db.or.views.endpoints.replace(ctx, currentEndpoint._id, endpoint)
          counters.endpoints.update++
        }
      } else {
        // * insert
        await db.or.views.endpoints.insert(ctx, endpoint)
        counters.endpoints.insert++
      }
    }

    // update unavailable_at for endpoints that are no longer advertised
    for (const currentEndpoint of currentEndpointsMap.values()) {
      // * only set unavailable_at once when entity first becomes unavailable
      if (currentEndpoint.unavailable_at === undefined) {
        await db.or.views.endpoints.patch(ctx, currentEndpoint._id, {
          unavailable_at: parseInt(args.crawl_id),
        })
        counters.endpoints.unavailable++
      }
    }

    // * providers
    const currentProviders = await db.or.views.providers.collect(ctx)
    const currentProvidersMap = new Map(currentProviders.map((p) => [p.slug, p]))

    for (const provider of args.providers) {
      const currentProvider = currentProvidersMap.get(provider.slug)

      if (currentProvider) {
        currentProvidersMap.delete(currentProvider.slug)

        if (isEqual(currentProvider, provider)) {
          // * stable
          counters.providers.stable++
        } else {
          // * update
          await db.or.views.providers.replace(ctx, currentProvider._id, provider)
          counters.providers.update++
        }
      } else {
        // * insert
        await db.or.views.providers.insert(ctx, provider)
        counters.providers.insert++
      }
    }

    // update unavailable_at for providers that are no longer advertised
    for (const currentProvider of currentProvidersMap.values()) {
      // * only set unavailable_at once when entity first becomes unavailable
      if (currentProvider.unavailable_at === undefined) {
        await db.or.views.providers.patch(ctx, currentProvider._id, {
          unavailable_at: parseInt(args.crawl_id),
        })
        counters.providers.unavailable++
      }
    }

    // * log final counts
    console.log(`[materialize:counts]`, {
      models: counters.models,
      endpoints: counters.endpoints,
      providers: counters.providers,
    })
  },
})
