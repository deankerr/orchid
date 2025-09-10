import { v, type Infer } from 'convex/values'
import { z } from 'zod'

import { diff } from 'json-diff-ts'

import * as DB from '@/convex/db'

import { internal } from '../../_generated/api'
import { internalAction, internalMutation } from '../../_generated/server'
import { getArchiveBundleOrThrow } from '../bundle'
import type { CrawlArchiveBundle } from '../crawl'
import { EndpointTransformSchema } from './endpoints'

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

    const { models, endpoints, providers } = materializeModelEndpoints(bundle)

    console.log(`[materialize_v2]`, {
      models: models.length,
      endpoints: endpoints.length,
      providers: providers.length,
    })
    await ctx.runMutation(internal.snapshots.materialize_v2.main.upsertModelEndpoints, {
      models,
      endpoints,
      providers,
    })

    return null
  },
})

export function materializeModelEndpoints(bundle: CrawlArchiveBundle) {
  const rawEndpoints = bundle.data.models.flatMap((m) => m.endpoints)

  const modelsMap = new Map<string, Infer<typeof DB.OrViewsModels.vTable.validator>>()
  const endpointsMap = new Map<string, Infer<typeof DB.OrViewsEndpoints.vTable.validator>>()
  const providersMap = new Map<string, Infer<typeof DB.OrViewsProviders.vTable.validator>>()
  const issues: string[] = []

  for (const raw of rawEndpoints) {
    const parsed = EndpointTransformSchema.safeParse(raw)

    if (!parsed.success) {
      issues.push(z.prettifyError(parsed.error))
      continue
    }

    const { model, endpoint, provider } = parsed.data
    modelsMap.set(model.slug, model)
    endpointsMap.set(endpoint.uuid, endpoint)
    providersMap.set(provider.slug, provider)
  }

  if (issues.length) console.error('[materialize_v2:endpoints]', { issues })

  return {
    models: Array.from(modelsMap.values()),
    endpoints: Array.from(endpointsMap.values()),
    providers: Array.from(providersMap.values()),
  }
}

export const upsertModelEndpoints = internalMutation({
  args: {
    models: v.array(v.object(DB.OrViewsModels.vTable.validator.fields)),
    endpoints: v.array(v.object(DB.OrViewsEndpoints.vTable.validator.fields)),
    providers: v.array(v.object(DB.OrViewsProviders.vTable.validator.fields)),
  },
  handler: async (ctx, args) => {
    // * initialize counters
    const counters = {
      models: { stable: 0, update: 0, insert: 0, unavailable: 0 },
      endpoints: { stable: 0, update: 0, insert: 0, unavailable: 0 },
      providers: { stable: 0, update: 0, insert: 0, unavailable: 0 },
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

    // * providers
    const currentProviders = await DB.OrViewsProviders.collect(ctx)
    const currentProvidersMap = new Map(
      currentProviders
        .filter((p) => !p.unavailable_at)
        .map((p) => [p.slug, { ...p, updated_at: Date.now() }]),
    )

    for (const provider of args.providers) {
      const currentProvider = currentProvidersMap.get(provider.slug)

      if (currentProvider) {
        currentProvidersMap.delete(currentProvider.slug)

        if (isEqual(currentProvider, provider)) {
          // * stable
          counters.providers.stable++
        } else {
          // * update
          await ctx.db.replace(currentProvider._id, provider)
          counters.providers.update++
        }
      } else {
        // * insert
        await ctx.db.insert('or_views_providers', provider)
        counters.providers.insert++
      }
    }

    // update unavailable_at for providers that are no longer advertised
    for (const currentProvider of currentProvidersMap.values()) {
      await ctx.db.patch(currentProvider._id, { unavailable_at: Date.now() })
      counters.providers.unavailable++
    }

    // * log final counts
    console.log(`[materialize_v2:counts]`, {
      models: counters.models,
      endpoints: counters.endpoints,
      providers: counters.providers,
    })
  },
})
