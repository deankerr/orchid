import { v } from 'convex/values'
import z4 from 'zod/v4'

import { gunzipSync } from 'fflate'

import * as DB from '@/convex/db'

import { internal } from '../_generated/api'
import { internalAction, type ActionCtx } from '../_generated/server'
import { getHourAlignedTimestamp } from '../shared'
import { transformSchema as EndpointTransform } from '../snapshots_v2/sources/endpoints'
import { transformSchema as ModelAuthorTransform } from '../snapshots_v2/sources/modelAuthor'
import { transformSchema as ModelTransform } from '../snapshots_v2/sources/models'
import { transformSchema as ProviderTransform } from '../snapshots_v2/sources/providers'
import { transformSchema as UptimesTransform } from '../snapshots_v2/sources/uptimes'

// ------------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------------
const textDecoder = new TextDecoder()

async function getFromStorage(
  ctx: ActionCtx,
  storageId: string,
): Promise<{ data: unknown[] | null }> {
  try {
    const blob = await ctx.storage.get(storageId)
    if (!blob) return { data: null }

    const decompressed = gunzipSync(new Uint8Array(await blob.arrayBuffer()))
    const raw = JSON.parse(textDecoder.decode(decompressed))

    // Unwrap data field and ensure it's an array
    const UnwrapDataSchema = z4
      .object({ data: z4.unknown() })
      .transform(({ data }) => (Array.isArray(data) ? data : [data]) as unknown[])

    const data = UnwrapDataSchema.parse(raw)
    return { data }
  } catch (error) {
    console.error('Failed to get data from storage:', error)
    return { data: null }
  }
}

function pick<T>(arr: T[], pred: (v: T) => boolean): T | undefined {
  // tiny helper to grab the first element that matches
  for (const v of arr) if (pred(v)) return v
  return undefined
}

function consolidateVariants(models: ReturnType<typeof ModelTransform.parse>[]): any[] {
  // identical logic to v2 pipelines, trimmed
  return Map.groupBy(models, (m: any) => m.slug)
    .values()
    .map((variants: any[]) => {
      const [first, ...rest] = variants.sort((a, b) => a.name.length - b.name.length)
      const { variant, ...base } = first
      return {
        ...base,
        variants: [variant, ...rest.map((m) => m.variant)].filter(Boolean),
      }
    })
    .toArray()
}

async function calculateUptimeAverage(
  ctx: ActionCtx,
  uptimeArchives: any[],
  endpointUuid: string,
): Promise<number | undefined> {
  // Find uptime data for this specific endpoint UUID
  const uptimeRow = pick(
    uptimeArchives,
    (r) =>
      r.path.includes('/api/frontend/stats/uptime-hourly') && r.path.includes(`id=${endpointUuid}`),
  )

  if (!uptimeRow) return undefined

  try {
    // Get and parse the uptime data from storage
    const { data: rawData } = await getFromStorage(ctx, uptimeRow.storage_id)
    if (!rawData || rawData.length === 0) return undefined

    const parsed = UptimesTransform.safeParse(rawData[0])
    if (!parsed.success) return undefined

    // Calculate uptime average from valid uptime values
    const validUptimes = parsed.data
      .filter((u) => u.uptime !== null && u.uptime !== undefined)
      .map((u) => u.uptime!)

    if (validUptimes.length === 0) return undefined

    return validUptimes.reduce((sum, uptime) => sum + uptime, 0) / validUptimes.length
  } catch (error) {
    console.error(`Failed to calculate uptime for endpoint ${endpointUuid}:`, error)
    return undefined
  }
}

function aggregateTokenMetrics({
  stats,
  days,
  now = Date.now(),
}: {
  stats: Array<{
    timestamp: number
    input: number
    output: number
    requests: number
  }>
  days: number
  now?: number
}) {
  const timePeriod = days * 24 * 60 * 60 * 1000
  const cutoff = now - timePeriod
  const filteredMetrics = stats.filter((m) => m.timestamp >= cutoff)

  return {
    tokens: filteredMetrics.reduce((sum, m) => sum + m.input + m.output, 0),
    requests: filteredMetrics.reduce((sum, m) => sum + m.requests, 0),
  }
}

async function calculateModelStats(
  ctx: ActionCtx,
  archives: any[],
  snapshot_at: number,
): Promise<{
  modelStatsMap: Map<string, any>
  modelTokenStats: any[]
}> {
  const modelStatsMap = new Map<string, any>()
  const modelTokenStats: any[] = []

  // Find all model author archives
  const authorArchives = archives.filter((r) => r.path.includes('/api/frontend/model-author'))

  try {
    // Process each author archive
    for (const authorRow of authorArchives) {
      const { data: rawData } = await getFromStorage(ctx, authorRow.storage_id)
      if (!rawData || rawData.length === 0) continue

      const parsed = ModelAuthorTransform.safeParse(rawData[0])
      if (!parsed.success) continue

      // Extract model stats from the author data
      const { modelsWithStats } = parsed.data

      // Process each model's stats similar to modelTokenStatsPipeline
      for (const modelData of modelsWithStats) {
        const { model_permaslug, model_variant, stats } = modelData

        // Add to modelTokenStats array for database upserting (already in correct format)
        modelTokenStats.push({
          ...modelData,
          snapshot_at,
        })

        // Calculate aggregated stats for different time periods
        const stats7d = aggregateTokenMetrics({ stats, days: 7 })
        const stats30d = aggregateTokenMetrics({ stats, days: 30 })
        const stats90d = aggregateTokenMetrics({ stats, days: 90 })

        // Get or create stats object for this model
        if (!modelStatsMap.has(model_permaslug)) {
          modelStatsMap.set(model_permaslug, {})
        }

        const modelStats = modelStatsMap.get(model_permaslug)!
        modelStats[model_variant] = {
          tokens_7d: stats7d.tokens,
          tokens_30d: stats30d.tokens,
          tokens_90d: stats90d.tokens,
          requests_7d: stats7d.requests,
          requests_30d: stats30d.requests,
          requests_90d: stats90d.requests,
        }
      }
    }
  } catch (error) {
    console.error('Failed to calculate model stats:', error)
  }

  return { modelStatsMap, modelTokenStats }
}

// ------------------------------------------------------------------------------------
// Action: materialise a crawl into or_models / or_endpoints / or_providers
// ------------------------------------------------------------------------------------
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
    const providers: any[] = []
    const issues: { source: string; error: unknown }[] = []

    if (providerRow) {
      const { data: items } = await getFromStorage(ctx, providerRow.storage_id)
      if (items) {
        for (const item of items) {
          const parsed = ProviderTransform.safeParse(item)
          if (parsed.success) providers.push({ ...parsed.data, snapshot_at })
          else issues.push({ source: 'providers', error: parsed.error })
        }
      }
    }

    // --------------------------------------------------
    // 2. Models (variants) – needed before endpoints
    // --------------------------------------------------
    const modelsRow = pick(archives, (r) => r.path.startsWith('/api/frontend/models'))
    const modelsVariants: any[] = []
    if (modelsRow) {
      const { data: items } = await getFromStorage(ctx, modelsRow.storage_id)
      if (items) {
        for (const item of items) {
          const parsed = ModelTransform.safeParse(item)
          if (parsed.success) modelsVariants.push(parsed.data)
          else issues.push({ source: 'models', error: parsed.error })
        }
      }
    }

    // Calculate model stats from model author data if available
    const { modelStatsMap, modelTokenStats } = await calculateModelStats(ctx, archives, snapshot_at)

    const consolidatedModels = consolidateVariants(modelsVariants).map((m) => ({
      ...m,
      stats: modelStatsMap.get(m.permaslug) || {},
      snapshot_at,
    }))

    // map for quick lookup by permaslug
    const modelByPermaslug = new Map(consolidatedModels.map((m) => [m.permaslug, m]))

    // --------------------------------------------------
    // 3. Endpoints
    // --------------------------------------------------
    const endpoints: any[] = []

    for (const row of archives) {
      if (!row.path.startsWith('/api/frontend/stats/endpoint')) continue

      // Extract permaslug and variant from query string
      try {
        const url = new URL('https://x.com' + row.path)
        const permaslug = url.searchParams.get('permaslug') ?? ''
        const variant = url.searchParams.get('variant') ?? ''

        const { data: items } = await getFromStorage(ctx, row.storage_id)
        if (!items) continue

        const model = modelByPermaslug.get(permaslug)

        for (const item of items) {
          const parsed = EndpointTransform.safeParse(item)
          if (!parsed.success) {
            issues.push({ source: `endpoint:${permaslug}:${variant}`, error: parsed.error })
            continue
          }

          // Calculate uptime average if uptime data exists in this crawl
          const uptime_average = await calculateUptimeAverage(ctx, archives, parsed.data.uuid)

          const endpoint = {
            ...parsed.data,
            model_slug: model?.slug ?? '',
            model_permaslug: permaslug,
            snapshot_at,
            uptime_average,
            // basic capability merges
            capabilities: {
              ...parsed.data.capabilities,
              image_input: model?.input_modalities?.includes('image') ?? false,
              file_input: model?.input_modalities?.includes('file') ?? false,
            },
            or_model_created_at: model?.or_created_at ?? snapshot_at,
          }

          endpoints.push(endpoint)
        }
      } catch (err) {
        issues.push({ source: 'endpoint-path-parse', error: err })
      }
    }

    // --------------------------------------------------
    // 4. Persist
    // --------------------------------------------------
    if (providers.length)
      await ctx.runMutation(internal.openrouter.output.providers, { items: providers })

    if (consolidatedModels.length)
      await ctx.runMutation(internal.openrouter.output.models, { items: consolidatedModels })

    if (endpoints.length)
      await ctx.runMutation(internal.openrouter.output.endpoints, { items: endpoints })

    if (modelTokenStats.length)
      await ctx.runMutation(internal.openrouter.output.modelTokenStats, { items: modelTokenStats })

    console.log(
      `materialize: providers=${providers.length}, models=${consolidatedModels.length}, endpoints=${endpoints.length}, modelTokenStats=${modelTokenStats.length}, issues=${issues.length}`,
    )

    if (issues.length) {
      console.warn('materialize issues:', issues.slice(0, 5))
    }

    return null
  },
})
