import { v, type Infer } from 'convex/values'

import { diff } from 'json-diff-ts'

import * as DB from '@/convex/db'

import { internal } from '../../_generated/api'
import { internalAction, internalMutation } from '../../_generated/server'
import { getArchiveBundle } from '../bundle'
import { materializeModelEndpoints } from './endpoints'

type PModel = Infer<typeof DB.OrViewsModels.vTable.validator>
type PEndpoint = Infer<typeof DB.OrViewsEndpoints.vTable.validator>

export const modelEndpoints = internalAction({
  args: { crawl_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const crawl_id =
      args.crawl_id ?? (await ctx.runQuery(internal.db.snapshot.crawlArchives.getLatestCrawlId))

    if (!crawl_id) {
      console.log(`[materialize_v2] no crawl_id`)
      return null
    }

    const bundle = await getArchiveBundle(ctx, crawl_id)
    if (!bundle) {
      console.log(`[materialize_v2] no bundle found`, { crawl_id })
      return null
    }

    console.log(`[materialize_v2]`, { crawl_id })

    const modelEndpoints = materializeModelEndpoints(bundle)

    const modelsMap = new Map<string, PModel>()
    const endpointsMap = new Map<string, PEndpoint>()

    for (const item of modelEndpoints) {
      modelsMap.set(item.model.slug, item.model)
      endpointsMap.set(item.endpoint.uuid, item.endpoint)
    }

    console.log(`[materialize_v2]`, { models: modelsMap.size, endpoints: endpointsMap.size })
    await ctx.runMutation(internal.snapshots.materialize_v2.main.upsertModelEndpoints, {
      models: Array.from(modelsMap.values()),
      endpoints: Array.from(endpointsMap.values()),
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
    // * models
    const currentModels = await DB.OrViewsModels.collect(ctx)
    const currentModelsMap = new Map(currentModels.map((m) => [m.slug, m]))

    for (const model of args.models) {
      const currentModel = currentModelsMap.get(model.slug)

      if (!currentModel) {
        // * new
        model.updated_at = Date.now()
        await ctx.db.insert('or_views_models', model)
        continue
      }

      const changes = diff(currentModel, model, { keysToSkip: ['updated_at'] })
      if (changes.length > 0) {
        // * updated
        model.updated_at = Date.now()
        await ctx.db.replace(currentModel._id, model)
      }

      // don't mark as unavailable
      currentModelsMap.delete(currentModel.slug)
    }

    // update unavailable_at for models that are no longer advertised
    for (const currentModel of currentModelsMap.values()) {
      if (currentModel.unavailable_at) continue
      await ctx.db.patch(currentModel._id, { unavailable_at: Date.now() })
    }

    // * endpoints
    const currentEndpoints = await DB.OrViewsEndpoints.collect(ctx)
    const currentEndpointsMap = new Map(currentEndpoints.map((e) => [e.uuid, e]))

    for (const endpoint of args.endpoints) {
      const currentEndpoint = currentEndpointsMap.get(endpoint.uuid)
      if (!currentEndpoint) {
        // * new
        endpoint.updated_at = Date.now()
        await ctx.db.insert('or_views_endpoints', endpoint)
        continue
      }

      const changes = diff(currentEndpoint, endpoint, { keysToSkip: ['updated_at'] })
      if (changes.length > 0) {
        // * updated
        endpoint.updated_at = Date.now()
        await ctx.db.replace(currentEndpoint._id, endpoint)
      }

      // don't mark as unavailable
      currentEndpointsMap.delete(currentEndpoint.uuid)
    }

    // update unavailable_at for endpoints that are no longer advertised
    for (const currentEndpoint of currentEndpointsMap.values()) {
      if (currentEndpoint.unavailable_at) continue
      await ctx.db.patch(currentEndpoint._id, { unavailable_at: Date.now() })
    }
  },
})
