import type { Infer } from 'convex/values'

import { internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import * as ORAuthors from '../../db/or/authors'
import * as ORModels from '../../db/or/models'
import * as ORModelTokenStats from '../../db/or/modelTokenStats'
import { validateRecord, type Issue } from '../validation'
import { AuthorStrictSchema, AuthorTransformSchema } from '../validators/authors'
import {
  ModelTokenStatsStrictSchema,
  ModelTokenStatsTransformSchema,
} from '../validators/modelTokenStats'

export async function modelTokenStatsPipeline(
  ctx: ActionCtx,
  {
    snapshot_at,
    models,
    source,
  }: {
    snapshot_at: number
    run_id: string
    models: Infer<typeof ORModels.vTable.validator>[]
    source: {
      authors: (args: { authorSlug: string }) => Promise<unknown>
    }
  },
) {
  const started_at = Date.now()
  const modelTokenStats: Infer<typeof ORModelTokenStats.vTable.validator>[] = []
  const authors: Infer<typeof ORAuthors.vTable.validator>[] = []
  const issues: Issue[] = []

  for (const authorSlug of new Set(models.map((m) => m.author_slug))) {
    const data = await source.authors({ authorSlug })

    const { item: metricsItems, issues: metricsIssues } = validateRecord(
      data,
      ModelTokenStatsTransformSchema,
      ModelTokenStatsStrictSchema,
    )
    issues.push(...metricsIssues)
    modelTokenStats.push(...metricsItems.map((m) => ({ ...m, snapshot_at })))

    const { item: authorItem, issues: authorIssues } = validateRecord(
      data,
      AuthorTransformSchema,
      AuthorStrictSchema,
    )
    issues.push(...authorIssues)
    authors.push({ ...authorItem, snapshot_at })
  }

  const authorsResults = await ctx.runMutation(internal.openrouter.entities.authors.upsert, {
    items: authors,
  })

  const modelTokenStatsResults = await ctx.runMutation(
    internal.openrouter.entities.modelTokenStats.upsert,
    {
      items: modelTokenStats,
    },
  )

  // * model aggregate stats
  const modelStatsEntries = [...Map.groupBy(modelTokenStats, (m) => m.model_permaslug)].map(
    ([permaslug, items]) => {
      return {
        permaslug,
        stats: Object.fromEntries(
          items.map(({ model_variant, stats }) => {
            const stats7d = aggregateTokenMetrics({ stats, days: 7 })
            const stats30d = aggregateTokenMetrics({ stats, days: 30 })
            const stats90d = aggregateTokenMetrics({ stats, days: 90 })
            return [
              model_variant,
              {
                tokens_7d: stats7d.tokens,
                tokens_30d: stats30d.tokens,
                tokens_90d: stats90d.tokens,
                requests_7d: stats7d.requests,
                requests_30d: stats30d.requests,
                requests_90d: stats90d.requests,
              },
            ]
          }),
        ),
      }
    },
  )

  // Update models with aggregated stats
  await ctx.runMutation(internal.openrouter.entities.models.updateStats, {
    items: modelStatsEntries,
  })

  return {
    data: undefined,
    metrics: {
      entities: [authorsResults, modelTokenStatsResults],
      issues,
      started_at,
      ended_at: Date.now(),
    },
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
