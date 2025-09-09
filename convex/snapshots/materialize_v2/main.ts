import { v } from 'convex/values'

import { diff } from 'json-diff-ts'

import * as DB from '@/convex/db'

import { internal } from '../../_generated/api'
import { internalAction, internalMutation } from '../../_generated/server'
import { getArchiveBundleOrThrow } from '../bundle'
import { materializeModelEndpoints } from './endpoints'

function isEqual(from: Record<string, unknown>, to: Record<string, unknown>) {
  const changes = diff(from, to, {
    keysToSkip: ['_id', '_creationTime', 'updated_at'],
  })
  return changes.length === 0
}

export const modelEndpoints = internalAction({
  args: { crawl_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const bundle = await getArchiveBundleOrThrow(ctx, args.crawl_id)

    console.log(`[materialize_v2]`, { crawl_id: bundle.crawl_id })

    const { models, endpoints } = materializeModelEndpoints(bundle)

    console.log(`[materialize_v2]`, { models: models.length, endpoints: endpoints.length })
    await ctx.runMutation(internal.snapshots.materialize_v2.main.upsertModelEndpoints, {
      models,
      endpoints,
    })

    return null
  },
})

export const upsertModelEndpoints = internalMutation({
  args: {
    models: v.array(v.object(DB.OrViewsModels.vTable.validator.fields)),
    endpoints: v.array(v.object(DB.OrViewsEndpoints.vTable.validator.fields)),
  },
  handler: async (ctx, args) => {
    // * initialize counters
    const counters = {
      models: { stable: 0, update: 0, insert: 0, unavailable: 0 },
      endpoints: { stable: 0, update: 0, insert: 0, unavailable: 0 },
    }

    // * models
    const currentModels = await DB.OrViewsModels.collect(ctx)
    const currentModelsMap = new Map(
      currentModels
        .filter((m) => !m.unavailable_at)
        .map((m) => [m.slug, { ...m, updated_at: Date.now() }]),
    )

    for (const model of args.models) {
      const currentModel = currentModelsMap.get(model.slug)

      if (currentModel) {
        currentModelsMap.delete(currentModel.slug)

        if (isEqual(currentModel, model)) {
          // * stable
          counters.models.stable++
        } else {
          // * update
          await ctx.db.replace(currentModel._id, model)
          counters.models.update++
        }
      } else {
        // * insert
        await ctx.db.insert('or_views_models', model)
        counters.models.insert++
      }
    }

    // update unavailable_at for models that are no longer advertised
    for (const currentModel of currentModelsMap.values()) {
      await ctx.db.patch(currentModel._id, { unavailable_at: Date.now() })
      counters.models.unavailable++
    }

    // * endpoints
    const currentEndpoints = await DB.OrViewsEndpoints.collect(ctx)
    const currentEndpointsMap = new Map(
      currentEndpoints
        .filter((e) => !e.unavailable_at)
        .map((e) => [e.uuid, { ...e, updated_at: Date.now() }]),
    )

    for (const endpoint of args.endpoints) {
      const currentEndpoint = currentEndpointsMap.get(endpoint.uuid)

      if (currentEndpoint) {
        currentEndpointsMap.delete(currentEndpoint.uuid)

        if (isEqual(currentEndpoint, endpoint)) {
          // * stable
          counters.endpoints.stable++
        } else {
          // * update
          await ctx.db.replace(currentEndpoint._id, endpoint)
          counters.endpoints.update++
        }
      } else {
        // * insert
        await ctx.db.insert('or_views_endpoints', endpoint)
        counters.endpoints.insert++
      }
    }

    // update unavailable_at for endpoints that are no longer advertised
    for (const currentEndpoint of currentEndpointsMap.values()) {
      await ctx.db.patch(currentEndpoint._id, { unavailable_at: Date.now() })
      counters.endpoints.unavailable++
    }

    // * log final counts
    console.log(`[materialize_v2:counts]`, {
      models: counters.models,
      endpoints: counters.endpoints,
    })
  },
})
