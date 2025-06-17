import z4 from 'zod/v4'

import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { internalAction, internalMutation, type ActionCtx, type MutationCtx } from '../_generated/server'
import { getEpoch } from '../shared'
import { orFetch } from './client'
import { logIssues, validateArray, validateRecord } from './validation'
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
import { ProviderStrictSchema } from '../provider_views/schemas'
import { ProviderTransformSchema } from '../provider_views/schemas'
import { ProviderViewFn, ProviderViews } from '../provider_views/table'

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

    // models / endpoints / apps
    const { authorSlugs, appResults, modelAssemblyResults } = await syncModelsEndpointsApps(ctx, { epoch })

    // authors + model token stats
    const { authorResults, modelTokenStatsResults } = await syncAuthorsModelTokens(ctx, {
      authorSlugs,
      epoch,
    })

    // providers
    const providerResults = await syncProviders(ctx, { epoch })

    console.log('providerResults', providerResults)
    console.log('modelTokenStatsResults', modelTokenStatsResults)
    console.log('appResults', appResults)
    console.log('authorResults', authorResults)
    console.log('modelAssemblyResults', modelAssemblyResults)
  },
})

function consolidateResults(results: MergeResult[]): Record<string, number> {
  const actions: Record<string, number> = {}

  for (const result of results) {
    actions[result.action] = (actions[result.action] || 0) + 1
  }

  return actions
}

/**
 * -----------------------------------------------------
 * Models / Endpoints / Apps
 * -----------------------------------------------------
 */

async function syncModelsEndpointsApps(ctx: ActionCtx, { epoch }: { epoch: number }) {
  // deduped apps
  const apps = new Map<number, AppView>()

  // models
  const { models } = await modelSnapshot({ epoch })
  console.log('models:', models.length)

  const modelAssemblyResults: any[] = []
  for (const model of models) {
    // endpoints (+stats)
    const endpointResult = await endpointSnapshot({ model })

    // endpoint uptimes
    const endpointUptimes: EndpointUptimeStats[] = []
    for (const { uuid } of endpointResult.endpoints) {
      const res = await uptimeSnapshot({ endpoint_uuid: uuid })
      endpointUptimes.push(...res.uptimes)
    }

    // apps & app token stats
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
        appTokens,
      },
    })

    modelAssemblyResults.push({ ...result, slug: model.slug })
  }

  // apps
  console.log('apps:', apps.size)
  const appResults = await ctx.runMutation(internal.openrouter.sync.mergeApps, {
    apps: Array.from(apps.values()),
  })

  const authorSlugs = new Set(models.map((m) => m.author_slug))

  return { appResults, authorSlugs, modelAssemblyResults }
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

/**
 * -----------------------------------------------------
 * Authors / Model Tokens
 * -----------------------------------------------------
 */

async function syncAuthorsModelTokens(
  ctx: ActionCtx,
  { authorSlugs, epoch }: { authorSlugs: Set<string>; epoch: number },
) {
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

  return { authorResults, modelTokenStatsResults }
}

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

/**
 * -----------------------------------------------------
 * Providers
 * -----------------------------------------------------
 */

async function syncProviders(ctx: ActionCtx, { epoch }: { epoch: number }) {
  const result = await orFetch('/api/frontend/all-providers', {
    schema: z4.object({ data: z4.unknown().array() }),
  })

  const { items: providers, issues } = validateArray(
    result.data,
    ProviderTransformSchema,
    ProviderStrictSchema,
    (provider) => ({
      ...provider,
      epoch,
    }),
  )

  logIssues('providers', issues)

  const providerResults = await ctx.runMutation(internal.openrouter.sync.mergeProviders, {
    providers,
  })

  return providerResults
}

export const mergeProviders = internalMutation({
  args: {
    providers: v.array(v.object(ProviderViews.withoutSystemFields)),
  },
  handler: async (ctx: MutationCtx, { providers }) => {
    const results = await Promise.all(providers.map((provider) => ProviderViewFn.merge(ctx, { provider })))
    return consolidateResults(results)
  },
})

export const runSyncProviders = internalAction({
  args: {
    epoch: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const epoch = args.epoch || getEpoch()
    const result = await syncProviders(ctx, { epoch })
    console.log('providerResults', result)
  },
})
