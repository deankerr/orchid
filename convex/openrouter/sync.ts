import z4 from 'zod/v4'

import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { internalAction, internalMutation, type MutationCtx } from '../_generated/server'
import { getEpoch } from '../shared'
import { orFetch } from './client'
import { validateRecord } from './validation'
import type { MergeResult } from '../types'

// snapshots
import { snapshot as appSnapshot } from '../app_views/snapshot'
import { snapshot as uptimeSnapshot } from '../endpoint_uptime_stats/snapshot'
import { snapshot as endpointSnapshot } from '../endpoint_views/snapshot'
import { snapshot as modelSnapshot } from '../model_views/snapshot'

// entity helpers
import { AppTokenStats, AppTokenStatsFn } from '../app_token_stats/table'
import { AppViewFn, AppViews, type AppView } from '../app_views/table'
import { AuthorViews, AuthorViewsFn, type AuthorView } from '../author_views/table'
import { EndpointStats, EndpointStatsFn } from '../endpoint_stats/table'
import { EndpointUptimeStats, EndpointUptimeStatsFn } from '../endpoint_uptime_stats/table'
import { EndpointViewFn, EndpointViews } from '../endpoint_views/table'
import { ModelTokenStats, ModelTokenStatsFn } from '../model_token_stats/table'
import { ModelsViewFn, ModelViews } from '../model_views/table'

import { AuthorStrictSchema, AuthorTransformSchema } from '../author_views/schemas'
import { ModelTokenStatsStrictSchema, ModelTokenStatsTransformSchema } from '../model_token_stats/schemas'

const vModelViewAssembly = v.object({
  model: v.object(ModelViews.withoutSystemFields),
  endpoints: v.array(v.object(EndpointViews.withoutSystemFields)),
  endpointStats: v.array(v.object(EndpointStats.withoutSystemFields)),
  endpointUptimes: v.array(v.object(EndpointUptimeStats.withoutSystemFields)),
  appTokens: v.array(v.object(AppTokenStats.withoutSystemFields)),
})

export const run = internalAction({
  args: {
    epoch: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const epoch = args.epoch || getEpoch()
    console.log('openrouter.sync epoch', epoch)

    /**
     * -----------------------------------------------------
     * 1. Models
     * -----------------------------------------------------
     */
    const { models } = await modelSnapshot({ epoch })
    console.log('models:', models.length)

    /**
     * -----------------------------------------------------
     * 2. Collect downstream entities
     * -----------------------------------------------------
     */

    const apps = new Map<number, AppView>()
    const modelAssemblyResults: any[] = []

    for (const model of models) {
      // 2a. Endpoints (+stats)
      const endpointResult = await endpointSnapshot({ model })

      // 2b. Endpoint uptimes
      const endpointUptimes: EndpointUptimeStats[] = []
      for (const { uuid } of endpointResult.endpoints) {
        const res = await uptimeSnapshot({ endpoint_uuid: uuid })
        endpointUptimes.push(...res.uptimes)
      }

      // 2c. Apps & app token stats (per variant)
      const appTokens: AppTokenStats[] = []
      for (const variant of model.variants) {
        const appRes = await appSnapshot({
          slug: model.slug,
          permaslug: model.permaslug,
          variant,
          epoch,
        })

        appTokens.push(...appRes.appTokens)

        for (const app of appRes.apps) {
          if (!apps.has(app.app_id)) {
            apps.set(app.app_id, app)
          }
        }
      }

      const result = await ctx.runMutation(internal.openrouter.sync.mergeModelViewAssembly, {
        assembly: {
          model,
          endpoints: endpointResult.endpoints,
          endpointStats: endpointResult.stats,
          endpointUptimes,
          appTokens: appTokens,
        },
      })

      modelAssemblyResults.push({ ...result, slug: model.slug })
    }

    /**
     * -----------------------------------------------------
     * 3. Persist downstream entities
     * -----------------------------------------------------
     */

    console.log('apps:', apps.size)
    const appsRes = await ctx.runMutation(internal.openrouter.sync.mergeApps, {
      apps: Array.from(apps.values()),
    })

    const authorSlugs = new Set(models.map((m) => m.author_slug))
    console.log('authorSlugs', authorSlugs.size)

    const authors: AuthorView[] = []
    const modelTokenStatsResults: any[] = []

    for (const authorSlug of authorSlugs) {
      const result = await orFetch('/api/frontend/model-author', {
        params: { authorSlug, shouldIncludeStats: true, shouldIncludeVariants: false },
        schema: z4.object({ data: z4.unknown() }),
      })

      const { item: author } = validateRecord(result.data, AuthorTransformSchema, AuthorStrictSchema)
      authors.push({ ...author, epoch })

      const { item: modelTokenStats } = validateRecord(
        result.data,
        ModelTokenStatsTransformSchema,
        ModelTokenStatsStrictSchema,
      )

      const modelTokenStatsResult = await ctx.runMutation(internal.openrouter.sync.mergeModelTokenStats, {
        modelTokenStats,
      })

      modelTokenStatsResults.push({ ...modelTokenStatsResult, slug: author.slug })
    }

    const authorResults = await ctx.runMutation(internal.openrouter.sync.mergeAuthors, {
      authors,
    })

    console.log('modelTokenStatsResults', modelTokenStatsResults)
    console.log('appResults', appsRes)
    console.log('authorResults', authorResults)
    console.log('modelAssemblyResults', modelAssemblyResults)
  },
})

/* ------------------------------------------------------------------
 * Merge mutations
 * ------------------------------------------------------------------ */

function consolidateResults(results: MergeResult[]): Record<string, number> {
  const actions: Record<string, number> = {}

  for (const result of results) {
    actions[result.action] = (actions[result.action] || 0) + 1
  }

  return actions
}

export const mergeModelViewAssembly = internalMutation({
  args: {
    assembly: vModelViewAssembly,
  },
  handler: async (ctx, { assembly }) => {
    const modelResult = await ModelsViewFn.merge(ctx, { model: assembly.model })

    const endpointResults = await Promise.all(
      assembly.endpoints.map((endpoint) => EndpointViewFn.merge(ctx, { endpoint })),
    )

    const endpointStatsResults = await Promise.all(
      assembly.endpointStats.map((stats) => EndpointStatsFn.merge(ctx, { endpointStats: stats })),
    )

    const endpointUptimeResults = await EndpointUptimeStatsFn.mergeTimeSeries(ctx, {
      endpointUptimesSeries: assembly.endpointUptimes,
    })

    const appTokenResults = await Promise.all(
      assembly.appTokens.map((token) => AppTokenStatsFn.merge(ctx, { appTokenStats: token })),
    )

    const results = {
      model: modelResult.action,
      endpoints: consolidateResults(endpointResults),
      endpointStats: consolidateResults(endpointStatsResults),
      endpointUptimes: consolidateResults(endpointUptimeResults),
      appTokens: consolidateResults(appTokenResults),
    }

    return results
  },
})

export const mergeApps = internalMutation({
  args: {
    apps: v.array(v.object(AppViews.withoutSystemFields)),
  },
  handler: async (ctx, { apps }) => {
    const results = await Promise.all(apps.map((app) => AppViewFn.merge(ctx, { app })))
    return consolidateResults(results)
  },
})

export const mergeModelTokenStats = internalMutation({
  args: {
    modelTokenStats: v.array(v.object(ModelTokenStats.withoutSystemFields)),
  },
  handler: async (ctx: MutationCtx, { modelTokenStats }) => {
    const results = await ModelTokenStatsFn.mergeTimeSeries(ctx, { modelTokenStats })
    return consolidateResults(results)
  },
})

export const mergeAuthors = internalMutation({
  args: {
    authors: v.array(v.object(AuthorViews.withoutSystemFields)),
  },
  handler: async (ctx: MutationCtx, { authors }) => {
    const results = await Promise.all(authors.map((author) => AuthorViewsFn.merge(ctx, { author })))
    return consolidateResults(results)
  },
})
