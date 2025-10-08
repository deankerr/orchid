import { pruneNull } from 'convex-helpers'
import { v } from 'convex/values'
import * as R from 'remeda'
import z from 'zod'

import { internal } from '../../_generated/api'
import { Doc } from '../../_generated/dataModel'
import { ActionCtx, internalAction } from '../../_generated/server'
import { paginateAndProcess } from '../../shared'
import { CrawlArchiveBundle } from '../crawl/main'
import { ModelTransformSchema } from '../materialize/validators/models'
import { getArchiveBundleOrThrow } from '../shared/bundle'

const AnalyticsStatsRecord = z.object({
  date: z.string(),
  model_permaslug: z.string(),
  variant: z.string(),
  variant_permaslug: z.string(),
  count: z.number(),
  total_completion_tokens: z.number(),
  total_prompt_tokens: z.number(),
  total_native_tokens_reasoning: z.number(),
  num_media_prompt: z.number(),
  num_media_completion: z.number(),
  total_native_tokens_cached: z.number(),
  total_tool_calls: z.number(),
})

const AnalyticsStats = z
  .record(z.string(), AnalyticsStatsRecord)
  .transform((val) => Object.values(val))

const Analytics = z.object({
  models: ModelTransformSchema.array(),
  analytics: AnalyticsStats,
})

export function processStats(bundle: CrawlArchiveBundle) {
  const rawData = bundle.data.analytics
  if (!rawData) {
    console.warn('no analytics in this bundle')
    return
  }

  const parsed = Analytics.safeParse(rawData)
  if (!parsed.success) {
    console.error(z.prettifyError(parsed.error))
    return
  }

  const crawlDate = new Date(Number(bundle.crawl_id))
  crawlDate.setUTCHours(0, 0, 0, 0)
  const timestamp = crawlDate.getTime()

  // find matching model record for slug/base_slug
  const stats = parsed.data.analytics.map((data) => {
    const model = parsed.data.models.find(
      (m) => m.version_slug === data.model_permaslug && m.variant === data.variant,
    )

    // these are stats for an old model that is no longer available
    if (!model) return null

    return {
      timestamp,
      slug: model.slug,
      base_slug: model.base_slug,
      version_slug: data.model_permaslug,
      variant: data.variant,
      total_input_tokens: data.total_prompt_tokens,
      total_output_tokens: data.total_completion_tokens,
      num_media_input: data.num_media_prompt,
      num_media_output: data.num_media_completion,
      ...R.pick(data, [
        'count',
        'total_native_tokens_cached',
        'total_native_tokens_reasoning',
        'total_tool_calls',
        'date',
      ]),
    }
  })

  return pruneNull(stats)
}

export const run = internalAction({
  args: {
    crawl_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bundle = await getArchiveBundleOrThrow(ctx, args.crawl_id)
    const stats = processStats(bundle)
    if (!stats) return

    const upsertCounts = await ctx.runMutation(internal.db.or.stats.upsert, { stats })

    console.log('[snapshots:stats:run]', {
      crawl_id: bundle.crawl_id,
      date: new Date(Number(bundle.crawl_id)).toISOString(),
      count: stats.length,
      upsertCounts,
    })
  },
})

async function processArchivePage(ctx: ActionCtx, archives: Doc<'snapshot_crawl_archives'>[]) {
  for (const archive of archives) {
    const bundle = await getArchiveBundleOrThrow(ctx, archive.crawl_id)
    if (!bundle.data.analytics) continue

    const stats = processStats(bundle)
    if (!stats) continue

    const upsertCounts = await ctx.runMutation(internal.db.or.stats.upsert, { stats })

    console.log('[snapshots:stats:backfill]', {
      crawl_id: bundle.crawl_id,
      date: new Date(Number(bundle.crawl_id)).toISOString(),
      count: stats.length,
      upsertCounts,
    })
  }
}

export const backfill = internalAction({
  handler: async (ctx) => {
    await paginateAndProcess(ctx, {
      queryFnArgs: {},
      queryFn: async (ctx, args) =>
        await ctx.runQuery(internal.db.snapshot.crawl.archives.list, args),
      processFn: async (archives) => await processArchivePage(ctx, archives),
      batchSize: 100,
    })
  },
})
