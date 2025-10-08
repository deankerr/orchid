import { pruneNull } from 'convex-helpers'
import { PaginationResult } from 'convex/server'
import { v } from 'convex/values'
import * as R from 'remeda'
import z from 'zod'

import { internal } from '../../_generated/api'
import { Doc } from '../../_generated/dataModel'
import { internalAction } from '../../_generated/server'
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

    const sortedDateCounts = R.pipe(
      stats,
      R.countBy((stat) => new Date(stat.timestamp).toISOString()),
      R.entries(),
      R.sortBy(([key]) => key),
      R.fromEntries(),
    )

    console.log('[snapshots:stats:run]', {
      crawl_id: bundle.crawl_id,
      date: new Date(Number(bundle.crawl_id)).toISOString(),
      count: stats.length,
      dateCounts: sortedDateCounts,
      upsertCounts,
    })
  },
})

export const backfill = internalAction({
  handler: async (ctx) => {
    const results: PaginationResult<Doc<'snapshot_crawl_archives'>> = await ctx.runQuery(
      internal.db.snapshot.crawl.archives.list,
      {
        paginationOpts: {
          numItems: 100,
          cursor: null,
        },
      },
    )

    for (const archive of results.page) {
      const bundle = await getArchiveBundleOrThrow(ctx, archive.crawl_id)
      if (!bundle.data.analytics) continue

      const stats = processStats(bundle)
      if (!stats) continue

      const upsertCounts = await ctx.runMutation(internal.db.or.stats.upsert, { stats })

      const sortedDateCounts = R.pipe(
        stats,
        R.countBy((stat) => new Date(stat.timestamp).toISOString()),
        R.entries(),
        R.sortBy(([key]) => key),
        R.fromEntries(),
      )

      console.log('[snapshots:stats:backfill]', {
        crawl_id: bundle.crawl_id,
        date: new Date(Number(bundle.crawl_id)).toISOString(),
        count: stats.length,
        dateCounts: sortedDateCounts,
        upsertCounts,
      })
    }
  },
})
