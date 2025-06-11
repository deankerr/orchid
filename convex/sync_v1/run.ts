import { ConvexError, v, type AsObjectValidator, type Infer } from 'convex/values'
import { internal } from '../_generated/api'
import { internalAction, internalMutation, type ActionCtx } from '../_generated/server'
import { openrouter } from '../openrouter/client'
import { fetchApps, mergeApps, mergeAppTokens, vAppsFields, vAppTokensFields } from './apps_v1'
import { mergeAuthor, parseAuthorRecord, vAuthorFields } from './authors_v1'
import { mergeEndpointStats, vEndpointStatsFields } from './endpoint_stats_v1'
import { fetchEndpointUptime, mergeEndpointUptimes, vEndpointUptimeFields } from './endpoint_uptime_v1'
import { fetchEndpoints, mergeEndpoint, vEndpointFields } from './endpoints_v1'
import { mergeModelTokensStats, parseModelWithStatsRecords, vModelTokensFields } from './model_tokens_v1'
import { fetchModels, mergeModel, vModelFields } from './models_v1'
import { getEpoch } from '../shared'

export const run = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, args) => {
    const epoch = args.epoch || getEpoch()
    console.log('epoch:', epoch)

    // combined deduped apps
    const appsMap = new Map<number, Infer<AsObjectValidator<typeof vAppsFields>>>()

    // * models with endpoints data
    const models = await fetchModels()
    for (const m of models) {
      const model = {
        ...m,
        epoch,
      }

      const endpointResults = await syncEndpointData(ctx, model)
      for (const [id, app] of endpointResults.appsMap) {
        if (!appsMap.has(id)) appsMap.set(id, app)
      }
    }

    // * apps
    await ctx.runMutation(internal.sync_v1.run.mergeAppProjections, {
      apps: Array.from(appsMap.values()),
    })

    // * authors and model_tokens data
    const authorSlugs = new Set(models.map((m) => m.author_slug))
    console.log('authorSlugs', authorSlugs.size)

    const authors: Infer<AsObjectValidator<typeof vAuthorFields>>[] = []

    for (const authorSlug of authorSlugs) {
      const { author } = await syncModelAuthorTokensData(ctx, authorSlug)
      authors.push({
        ...author,
        epoch,
      })
    }

    await ctx.runMutation(internal.sync_v1.run.mergeAuthorsData, {
      authors,
    })
  },
})

async function syncEndpointData(ctx: ActionCtx, model: Infer<AsObjectValidator<typeof vModelFields>>) {
  const endpoints: Infer<AsObjectValidator<typeof vEndpointFields>>[] = []
  const stats: Infer<AsObjectValidator<typeof vEndpointStatsFields>>[] = []
  const uptimes: Infer<AsObjectValidator<typeof vEndpointUptimeFields>>[] = []
  const appTokens: Infer<AsObjectValidator<typeof vAppTokensFields>>[] = []

  // store copy of each app to combine later
  const appsMap = new Map<number, Infer<AsObjectValidator<typeof vAppsFields>>>()

  for (const variant of model.variants) {
    const result = await fetchEndpoints({
      permaslug: model.permaslug,
      variant,
    })

    // add model metadata to endpoints
    endpoints.push(
      ...result.endpoints.map((endpoint) => ({
        ...endpoint,
        model_slug: model.slug,
        model_permaslug: model.permaslug,
        capabilities: {
          ...endpoint.capabilities,
          image_input: model.input_modalities.includes('image'),
          file_input: model.input_modalities.includes('file'),
        },
        origin_model_created_at: model.origin_created_at,
        origin_model_updated_at: model.origin_updated_at,
        epoch: model.epoch,
      })),
    )

    stats.push(
      ...result.stats.map((stat) => ({
        ...stat,
        epoch: model.epoch,
      })),
    )

    for (const endpoint of result.endpoints) {
      const uptimesResults = await fetchEndpointUptime({ endpoint_uuid: endpoint.uuid })
      uptimes.push(...uptimesResults)
    }

    const appResults = await fetchApps({ permaslug: model.permaslug, variant })
    for (const app of appResults.apps) {
      if (!appsMap.has(app.app_id)) {
        appsMap.set(app.app_id, { ...app, epoch: model.epoch })
      }
    }

    for (const { app_id, total_tokens } of appResults.appTokens) {
      appTokens.push({
        app_id,
        total_tokens,
        epoch: model.epoch,
        model_slug: model.slug,
        model_permaslug: model.permaslug,
        model_variant: variant,
      })
    }
  }

  await ctx.runMutation(internal.sync_v1.run.mergeModelEndpointsData, {
    model: {
      ...model,
      epoch: model.epoch,
    },
    endpoints,
    stats,
    uptimes,
    appTokens,
  })

  return { appsMap }
}

export const mergeModelEndpointsData = internalMutation({
  args: {
    model: v.object(vModelFields),
    endpoints: v.array(v.object(vEndpointFields)),
    stats: v.array(v.object(vEndpointStatsFields)),
    uptimes: v.array(v.object(vEndpointUptimeFields)),
    appTokens: v.array(v.object(vAppTokensFields)),
  },
  handler: async (ctx, { model, endpoints, stats, uptimes, appTokens }) => {
    await mergeModel(ctx, model)

    for (const endpoint of endpoints) {
      await mergeEndpoint(ctx, endpoint)
    }

    for (const stat of stats) {
      await mergeEndpointStats(ctx, stat)
    }

    await mergeEndpointUptimes(ctx, uptimes)
    await mergeAppTokens(ctx, appTokens)
  },
})

/* 
  app token stats are stored with the relevant model, but we can pool together
  all of the apps themselves and merge them in a single mutation.
*/
export const mergeAppProjections = internalMutation({
  args: {
    apps: v.array(v.object(vAppsFields)),
  },
  handler: async (ctx, { apps }) => {
    await mergeApps(ctx, apps)
  },
})

/* 
  the authors and model_tokens data come from the same 'modelAuthor' endpoint.
  we request the data here, and validate and process each entity separately.
  authors are returned to merge together.
*/
async function syncModelAuthorTokensData(ctx: ActionCtx, authorSlug: string) {
  const result = await openrouter.frontend.modelAuthor({ authorSlug })
  if (!result.success) throw new ConvexError(`failed to get author: ${authorSlug}`)

  const modelTokensStats = parseModelWithStatsRecords(result.data)
  await ctx.runMutation(internal.sync_v1.run.mergeModelTokensData, {
    modelTokensStats,
  })

  return {
    author: parseAuthorRecord(result.data),
  }
}

export const mergeModelTokensData = internalMutation({
  args: {
    modelTokensStats: v.array(v.object(vModelTokensFields)),
  },
  handler: async (ctx, { modelTokensStats }) => {
    await mergeModelTokensStats(ctx, modelTokensStats)
  },
})

export const mergeAuthorsData = internalMutation({
  args: {
    authors: v.array(v.object(vAuthorFields)),
  },
  handler: async (ctx, { authors }) => {
    for (const author of authors) {
      await mergeAuthor(ctx, author)
    }
  },
})
