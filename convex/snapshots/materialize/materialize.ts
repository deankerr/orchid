import { omit, pick } from 'convex-helpers'
import { v, type Infer } from 'convex/values'
import type z4 from 'zod/v4'

import * as DB from '@/convex/db'

import { internal } from '../../_generated/api'
import { internalAction } from '../../_generated/server'
import { getHourAlignedTimestamp } from '../../shared'
import type { CrawlArchiveBundle } from '../crawl'
import * as Transforms from '../transforms'
import { calculateAppsFromBundle } from './apps'
import { calculateModelStatsFromBundle } from './modelTokenStats'
import { consolidateVariants, getBundleFromCrawlId } from './utils'

export const run = internalAction({
  args: { crawl_id: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const snapshot_at = getHourAlignedTimestamp()

    const crawl_id =
      args.crawl_id ?? (await ctx.runQuery(internal.db.snapshot.crawlArchives.getLatestCrawlId))

    if (!crawl_id) {
      console.log(`[materialize] no crawl_id`)
      return null
    }

    const bundle = await getBundleFromCrawlId(ctx, crawl_id)
    if (!bundle) {
      console.log(`[materialize] no bundle found`, { crawl_id })
      return null
    }

    console.log(`[materialize]`, { crawl_id })

    // --------------------------------------------------
    // 1. Providers
    // --------------------------------------------------
    const providers: Infer<typeof DB.OrProviders.vTable.validator>[] = []
    const issues: { source: string; error: z4.ZodError }[] = []
    for (const item of bundle.data.providers) {
      const parsed = Transforms.providers.safeParse(item)
      if (parsed.success) providers.push({ ...parsed.data, snapshot_at })
      else issues.push({ source: 'providers', error: parsed.error })
    }

    // --------------------------------------------------
    // 2. Models (variants) – needed before endpoints
    // --------------------------------------------------
    const modelsVariants: z4.infer<typeof Transforms.models>[] = []
    for (const m of bundle.data.models) {
      const parsed = Transforms.models.safeParse(m.model)
      if (parsed.success) modelsVariants.push(parsed.data)
      else issues.push({ source: 'models', error: parsed.error })
    }

    const consolidatedModels = consolidateVariants(modelsVariants).map((m) => ({
      ...m,
      snapshot_at,
    }))

    // model tokens stats & author names from modelAuthors
    const {
      modelStatsMap,
      authorNameMap,
      modelTokenStats,
      issues: modelStatsIssues,
    } = await calculateModelStatsFromBundle(ctx, bundle, snapshot_at)
    issues.push(...modelStatsIssues)

    const consolidatedWithStats = consolidatedModels.map((m) => ({
      ...m,
      stats: modelStatsMap.get(m.permaslug) || {},
      author_name: authorNameMap.get(m.author_slug) ?? m.author_slug,
    }))

    // --------------------------------------------------
    // 3. Endpoints (per bundle model entry)
    // --------------------------------------------------
    const endpoints: Infer<typeof DB.OrEndpoints.vTable.validator>[] = []

    for (const entry of bundle.data.models) {
      const model = consolidatedWithStats.find((m) => m.permaslug === entry.model.permaslug)
      const variant = entry.model.endpoint?.variant
      if (!model || !variant) continue

      for (const item of entry.endpoints) {
        const parsed = Transforms.endpoints.safeParse(item)
        if (!parsed.success) {
          issues.push({ source: `endpoint:${model.permaslug}:${variant}`, error: parsed.error })
          continue
        }

        const uptime_average = await calculateUptimeAverageFromEntry(entry, parsed.data.uuid)

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

    // --------------------------------------------------
    // 4. Apps
    // --------------------------------------------------
    const {
      apps,
      modelAppLeaderboards,
      issues: appsIssues,
    } = await calculateAppsFromBundle(ctx, bundle, snapshot_at)
    issues.push(...appsIssues)

    // --------------------------------------------------
    // 5. Persist
    // --------------------------------------------------
    if (providers.length)
      await ctx.runMutation(internal.db.or.providers.upsert, { items: providers })

    if (consolidatedWithStats.length) {
      // Extract model details fields for separate table
      const modelDetails = consolidatedWithStats.map((m) =>
        pick(m, ['slug', 'description', 'tokenizer', 'instruct_type', 'warning_message']),
      )

      // Remove model details fields from models before upserting
      const modelsWithoutDetails = consolidatedWithStats.map((m) =>
        omit(m, ['description', 'tokenizer', 'instruct_type', 'warning_message']),
      )

      await ctx.runMutation(internal.db.or.models.upsert, { items: modelsWithoutDetails })
      await ctx.runMutation(internal.db.or.modelDetails.upsert, { items: modelDetails })
    }

    if (endpoints.length)
      await ctx.runMutation(internal.db.or.endpoints.upsert, { items: endpoints })

    console.log(`[materialize] done`, {
      providers: providers.length,
      models: consolidatedWithStats.length,
      endpoints: endpoints.length,
      apps: apps.length,
      leaderboards: modelAppLeaderboards.length,
      modelTokenStats: modelTokenStats.length,
      issues: issues.length,
    })

    if (issues.length) {
      console.warn('[materialize] issues:', issues.slice(0, 5))
    }

    return null
  },
})

/**
 * Compute mean uptime for an endpoint UUID from the bundle's uptimes, if present.
 */
export async function calculateUptimeAverageFromEntry(
  entry: CrawlArchiveBundle['data']['models'][number],
  endpointUuid: string,
): Promise<number | undefined> {
  // Find the tuple in entry.uptimes that matches this endpoint UUID
  const match = entry.uptimes.find(([id]) => id === endpointUuid)
  if (!match) return undefined

  const [, uptimePayload] = match
  const parsed = Transforms.uptimes.safeParse(uptimePayload)
  if (!parsed.success) return undefined

  const series = parsed.data.filter((u) => u.uptime != null).map((u) => u.uptime!)
  if (!series.length) return undefined

  return series.reduce((sum, value) => sum + value, 0) / series.length
}
