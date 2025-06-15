import { v } from 'convex/values'
import { internalAction, internalMutation } from '../_generated/server'
import { getEpoch } from '../shared'

// snapshots
import { snapshot as appSnapshot } from '../app_views/snapshot'
import { snapshot as uptimeSnapshot } from '../endpoint_uptime_stats/snapshot'
import { snapshot as endpointSnapshot } from '../endpoint_views/snapshot'
import { snapshot as modelSnapshot } from '../model_views/snapshot'

// table helpers (merge, diff)
import { AppTokenStats, AppTokenStatsFn } from '../app_token_stats/table'
import { AppViewFn, type AppView } from '../app_views/table'
import { EndpointStatsFn, type EndpointStat } from '../endpoint_stats/table'
import { EndpointUptimeStats, EndpointUptimeStatsFn } from '../endpoint_uptime_stats/table'
import { EndpointViewFn, type EndpointView } from '../endpoint_views/table'
import { ModelsViewFn } from '../model_views/table'

import z4 from 'zod/v4'
import { internal } from '../_generated/api'

// Shared summary validator for merge mutations
export const vMergeSummary = v.object({
  input: v.number(),
  inserted: v.number(),
  replaced: v.number(),
  changed: v.number(),
})

export const run = internalAction({
  args: {
    epoch: v.optional(v.number()),
  },
  returns: v.object({
    models: vMergeSummary,
    endpointViews: vMergeSummary,
    endpointStats: vMergeSummary,
    endpointUptimes: vMergeSummary,
    apps: vMergeSummary,
    appTokens: vMergeSummary,
  }),
  handler: async (ctx, args): Promise<any> => {
    const epoch = args.epoch || getEpoch()
    console.log('openrouter.sync epoch', epoch)

    /**
     * -----------------------------------------------------
     * 1. Models
     * -----------------------------------------------------
     */
    const { models } = await modelSnapshot({ epoch })
    const modelsRes = await ctx.runMutation(internal.openrouter.sync.mergeModels, { models })

    /**
     * -----------------------------------------------------
     * 2. Collect downstream entities
     * -----------------------------------------------------
     */
    const endpoints: EndpointView[] = []
    const endpointStats: EndpointStat[] = []
    const endpointUptimesByUuid = new Map<string, EndpointUptimeStats[]>()
    const apps = new Map<number, AppView>()
    const appTokens: AppTokenStats[] = []

    for (const model of models) {
      // 2a. Endpoints (+stats)
      const endpointResult = await endpointSnapshot({ model })
      logIssues('endpointSnapshot', endpointResult.issues)
      endpoints.push(...endpointResult.endpoints)
      endpointStats.push(...endpointResult.stats)

      // 2b. Endpoint uptimes (grouped by UUID)
      for (const endpoint of endpointResult.endpoints) {
        const uptimeRes = await uptimeSnapshot({ endpoint_uuid: endpoint.uuid })
        if (!endpointUptimesByUuid.has(endpoint.uuid)) {
          endpointUptimesByUuid.set(endpoint.uuid, [])
        }
        endpointUptimesByUuid.get(endpoint.uuid)!.push(...uptimeRes.uptimes)
      }

      // 2c. Apps & app token stats (per variant)
      for (const variant of model.variants) {
        const appRes = await appSnapshot({
          slug: model.slug,
          permaslug: model.permaslug,
          variant,
          epoch,
        })

        for (const app of appRes.apps) {
          if (!apps.has(app.app_id)) {
            apps.set(app.app_id, app)
          }
        }
        appTokens.push(...appRes.appTokens)
      }
    }

    /**
     * -----------------------------------------------------
     * 3. Persist downstream entities
     * -----------------------------------------------------
     */
    const epViewsRes = await ctx.runMutation(internal.openrouter.sync.mergeEndpointViews, { endpoints })
    const epStatsRes = await ctx.runMutation(internal.openrouter.sync.mergeEndpointStats, {
      stats: endpointStats,
    })

    // Process endpoint uptimes by UUID to avoid array size limits
    let totalUptimeInput = 0,
      totalUptimeInserted = 0,
      totalUptimeReplaced = 0
    for (const [endpointUuid, uptimes] of endpointUptimesByUuid) {
      const upRes = await ctx.runMutation(internal.openrouter.sync.mergeEndpointUptimesForUuid, {
        endpointUuid,
        uptimes,
      })
      totalUptimeInput += upRes.input
      totalUptimeInserted += upRes.inserted
      totalUptimeReplaced += upRes.replaced
    }
    const epUpRes = {
      input: totalUptimeInput,
      inserted: totalUptimeInserted,
      replaced: totalUptimeReplaced,
      changed: totalUptimeInserted + totalUptimeReplaced,
    }

    const appsRes = await ctx.runMutation(internal.openrouter.sync.mergeApps, {
      apps: Array.from(apps.values()),
    })
    const appTokRes = await ctx.runMutation(internal.openrouter.sync.mergeAppTokens, {
      appTokens,
    })

    return {
      models: modelsRes,
      endpointViews: epViewsRes,
      endpointStats: epStatsRes,
      endpointUptimes: epUpRes,
      apps: appsRes,
      appTokens: appTokRes,
    }
  },
})

/* ------------------------------------------------------------------
 * Merge helpers (internal mutations)
 * ------------------------------------------------------------------ */

export const mergeModels = internalMutation({
  args: {
    models: v.array(v.any()),
  },
  returns: vMergeSummary,
  handler: async (ctx, { models }) => {
    let inserted = 0,
      replaced = 0
    for (const model of models) {
      const result = await ModelsViewFn.merge(ctx, { model })
      if (result.action === 'insert') inserted++
      else if (result.action === 'replace') replaced++
    }
    return {
      input: models.length,
      inserted,
      replaced,
      changed: inserted + replaced,
    }
  },
})

export const mergeEndpointViews = internalMutation({
  args: {
    endpoints: v.array(v.any()),
  },
  returns: vMergeSummary,
  handler: async (ctx, { endpoints }) => {
    let inserted = 0,
      replaced = 0
    for (const endpoint of endpoints) {
      const result = await EndpointViewFn.merge(ctx, { endpoint })
      if (result.action === 'insert') inserted++
      else if (result.action === 'replace') replaced++
    }
    return { input: endpoints.length, inserted, replaced, changed: inserted + replaced }
  },
})

export const mergeEndpointStats = internalMutation({
  args: {
    stats: v.array(v.any()),
  },
  returns: vMergeSummary,
  handler: async (ctx, { stats }) => {
    let inserted = 0,
      replaced = 0
    for (const s of stats) {
      const result = await EndpointStatsFn.merge(ctx, { endpointStats: s })
      if (result.action === 'insert') inserted++
      else if (result.action === 'replace') replaced++
    }
    return { input: stats.length, inserted, replaced, changed: inserted + replaced }
  },
})

export const mergeEndpointUptimesForUuid = internalMutation({
  args: {
    endpointUuid: v.string(),
    uptimes: v.array(v.any()),
  },
  returns: vMergeSummary,
  handler: async (ctx, { uptimes }) => {
    let inserted = 0,
      replaced = 0,
      processed = 0

    // process newest -> oldest so we can early-exit when we hit a row with no diff
    uptimes.sort((a, b) => b.timestamp - a.timestamp)

    for (const uptime of uptimes) {
      const result = await EndpointUptimeStatsFn.merge(ctx, {
        endpointUptimeStats: uptime,
      })
      processed++
      if (result.action === 'insert') inserted++
      else if (result.action === 'replace') replaced++
      if (result.diff.length === 0) break // we already have this + all earlier entries
    }

    return { input: processed, inserted, replaced, changed: inserted + replaced }
  },
})

export const mergeEndpointUptimes = internalMutation({
  args: {
    uptimes: v.array(v.any()),
  },
  returns: vMergeSummary,
  handler: async (ctx, { uptimes }) => {
    let inserted = 0,
      replaced = 0,
      processed = 0
    const map = Map.groupBy(uptimes, (u) => u.endpoint_uuid)

    for (const items of map.values()) {
      // process newest -> oldest so we can early-exit when we hit a row with no diff
      items.sort((a, b) => b.timestamp - a.timestamp)

      for (const uptime of items) {
        const result = await EndpointUptimeStatsFn.merge(ctx, {
          endpointUptimeStats: uptime,
        })
        processed++
        if (result.action === 'insert') inserted++
        else if (result.action === 'replace') replaced++
        if (result.diff.length === 0) break // we already have this + all earlier entries
      }
    }
    return { input: processed, inserted, replaced, changed: inserted + replaced }
  },
})

export const mergeApps = internalMutation({
  args: {
    apps: v.array(v.any()),
  },
  returns: vMergeSummary,
  handler: async (ctx, { apps }) => {
    let inserted = 0,
      replaced = 0
    for (const app of apps) {
      const result = await AppViewFn.merge(ctx, { app })
      if (result.action === 'insert') inserted++
      else if (result.action === 'replace') replaced++
    }
    return { input: apps.length, inserted, replaced, changed: inserted + replaced }
  },
})

export const mergeAppTokens = internalMutation({
  args: {
    appTokens: v.array(v.any()),
  },
  returns: vMergeSummary,
  handler: async (ctx, { appTokens }) => {
    let inserted = 0,
      replaced = 0,
      processed = 0

    const map = Map.groupBy(appTokens, (t) => t.app_id)

    for (const tokens of map.values()) {
      tokens.sort((a, b) => b.epoch - a.epoch) // latest first

      for (const token of tokens) {
        const result = await AppTokenStatsFn.merge(ctx, {
          appTokenStats: token,
        })
        processed++
        if (result.action === 'insert') inserted++
        else if (result.action === 'replace') replaced++

        const diffEmpty = Array.isArray(result.diff)
          ? result.diff.length === 0
          : Object.keys(result.diff).length === 0
        if (diffEmpty) break // we already have this + all earlier entries
      }
    }
    return { input: processed, inserted, replaced, changed: inserted + replaced }
  },
})

type Issues = {
  transform: { index: number; error: z4.ZodError }[]
  strict: { index: number; error: z4.ZodError }[]
}

function logIssues(label: string, issues: Issues) {
  if (issues.transform.length > 0) {
    console.log(
      label,
      'transform',
      issues.transform.length,
      issues.transform.map((t) => ({ ...t, msg: z4.prettifyError(t.error) })).slice(0, 5),
    )
  }
  if (issues.strict.length > 0) {
    console.log(
      label,
      'strict',
      issues.strict.length,
      issues.strict.map((t) => ({ ...t, msg: z4.prettifyError(t.error) })).slice(0, 5),
    )
  }
}
