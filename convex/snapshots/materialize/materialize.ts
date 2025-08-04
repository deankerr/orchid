import { v, type Infer } from 'convex/values'
import type z4 from 'zod/v4'

import * as DB from '@/convex/db'

import { internal } from '../../_generated/api'
import { internalAction } from '../../_generated/server'
import { getHourAlignedTimestamp } from '../../shared'
import * as Transforms from '../transforms'
import { calculateApps } from './apps'
import { calculateModelStats } from './modelTokenStats'
import { calculateUptimeAverage } from './uptimes'
import { consolidateVariants, getFromStorage, pick } from './utils'

export const run = internalAction({
  args: { crawlId: v.string() },
  returns: v.null(),
  handler: async (ctx, { crawlId }) => {
    const snapshot_at = getHourAlignedTimestamp()

    const archives = await ctx.runQuery(internal.db.snapshot.rawArchives.getByCrawlId, { crawlId })
    console.log(
      `materialize: crawlId=${crawlId} snapshot_at=${snapshot_at} archives=${archives.length}`,
    )

    // --------------------------------------------------
    // 1. Providers
    // --------------------------------------------------
    const providerRow = pick(archives, (r) => r.path.startsWith('/api/frontend/all-providers'))
    const providers: Infer<typeof DB.OrProviders.vTable.validator>[] = []
    const issues: { source: string; error: z4.ZodError }[] = []

    if (providerRow) {
      const { data: items } = await getFromStorage(ctx, providerRow.storage_id)
      if (items) {
        for (const item of items) {
          const parsed = Transforms.providers.safeParse(item)
          if (parsed.success) providers.push({ ...parsed.data, snapshot_at })
          else issues.push({ source: 'providers', error: parsed.error })
        }
      }
    }

    // Calculate model stats from model author data if available
    const {
      modelStatsMap,
      authorNameMap,
      modelTokenStats,
      issues: modelStatsIssues,
    } = await calculateModelStats(ctx, archives, snapshot_at)
    issues.push(...modelStatsIssues)

    // --------------------------------------------------
    // 2. Models (variants) – needed before endpoints
    // --------------------------------------------------
    const modelsRow = pick(archives, (r) => r.path.startsWith('/api/frontend/models'))
    const modelsVariants: z4.infer<typeof Transforms.models>[] = []
    if (modelsRow) {
      const { data: items } = await getFromStorage(ctx, modelsRow.storage_id)
      if (items) {
        for (const item of items) {
          const parsed = Transforms.models.safeParse(item)
          if (parsed.success) modelsVariants.push(parsed.data)
          else issues.push({ source: 'models', error: parsed.error })
        }
      }
    }

    const consolidatedModels = consolidateVariants(modelsVariants).map((m) => {
      return {
        ...m,
        stats: modelStatsMap.get(m.permaslug) || {},
        author_name: authorNameMap.get(m.author_slug) ?? m.author_slug,
        snapshot_at,
      }
    })

    // --------------------------------------------------
    // 3. Endpoints
    // --------------------------------------------------
    const endpoints: Infer<typeof DB.OrEndpoints.vTable.validator>[] = []

    for (const model of consolidatedModels) {
      for (const variant of model.variants) {
        const endpointRow = pick(
          archives,
          (r) =>
            r.path ===
            `/api/frontend/stats/endpoint?permaslug=${model.permaslug}&variant=${variant}`,
        )
        if (!endpointRow) continue

        const { data: items } = await getFromStorage(ctx, endpointRow.storage_id)
        if (!items) continue

        for (const item of items) {
          const parsed = Transforms.endpoints.safeParse(item)
          if (!parsed.success) {
            issues.push({ source: `endpoint:${model.permaslug}:${variant}`, error: parsed.error })
            continue
          }

          // Calculate uptime average if uptime data exists in this crawl
          const uptime_average = await calculateUptimeAverage(ctx, archives, parsed.data.uuid)

          const endpoint = {
            ...parsed.data,
            model_slug: model.slug,
            model_permaslug: model.permaslug,
            snapshot_at,
            uptime_average,
            capabilities: {
              ...parsed.data.capabilities,
              image_input: model.input_modalities.includes('image'),
              file_input: model.input_modalities.includes('file'),
            },
            or_model_created_at: model.or_created_at,
          }

          endpoints.push(endpoint)
        }
      }
    }

    // --------------------------------------------------
    // 4. Apps
    // --------------------------------------------------
    const {
      apps,
      modelAppLeaderboards,
      issues: appsIssues,
    } = await calculateApps(ctx, archives, consolidatedModels, snapshot_at)
    issues.push(...appsIssues)

    // --------------------------------------------------
    // 5. Persist
    // --------------------------------------------------
    if (providers.length)
      await ctx.runMutation(internal.db.or.providers.upsert, { items: providers })

    if (consolidatedModels.length)
      await ctx.runMutation(internal.db.or.models.upsert, { items: consolidatedModels })

    if (endpoints.length)
      await ctx.runMutation(internal.db.or.endpoints.upsert, { items: endpoints })

    console.log(
      `materialize: providers=${providers.length}, models=${consolidatedModels.length}, endpoints=${endpoints.length}, apps=${apps.length}, leaderboards=${modelAppLeaderboards.length}, modelTokenStats=${modelTokenStats.length}, issues=${issues.length}`,
    )

    if (issues.length) {
      console.warn('materialize issues:', issues.slice(0, 5))
    }

    return null
  },
})
