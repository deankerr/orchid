import { v, type AsObjectValidator, type Infer } from 'convex/values'
import { internal } from '../_generated/api'
import { internalAction, internalMutation, type ActionCtx } from '../_generated/server'
import { mergeEndpointStats, vEndpointStatsFields } from './endpoint_stats_v1'
import { fetchEndpointUptime, mergeEndpointUptimes, vEndpointUptimeFields } from './endpoint_uptime_v1'
import { fetchEndpoints, mergeEndpoint, vEndpointFields } from './endpoints_v1'
import { fetchModels, mergeModel, vModelFields } from './models_v1'
import { fetchApps, mergeApps, mergeAppTokens, vAppsFields, vAppTokensFields } from './apps_v1'

export const run = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, args) => {
    const epoch = args.epoch || Date.now()

    // combined deduped apps
    const appsMap = new Map<number, Infer<AsObjectValidator<typeof vAppsFields>>>()

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

    console.log('appsMap', appsMap.size)
    await ctx.runMutation(internal.sync_v1.run.mergeAppProjections, {
      apps: Array.from(appsMap.values()),
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
        model_permaslug: model.permaslug,
        model_variant: variant,
      })
    }
  }

  await ctx.runMutation(internal.sync_v1.run.mergeModelProjections, {
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

export const mergeModelProjections = internalMutation({
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

export const mergeAppProjections = internalMutation({
  args: {
    apps: v.array(v.object(vAppsFields)),
  },
  handler: async (ctx, { apps }) => {
    await mergeApps(ctx, apps)
  },
})
