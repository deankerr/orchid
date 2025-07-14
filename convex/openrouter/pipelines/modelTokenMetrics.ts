import * as R from 'remeda'

import { internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import { OrAuthors } from '../entities/authors'
import { OrModels } from '../entities/models'
import type { OrModelTokenMetrics } from '../entities/modelTokenMetrics'
import { batch, type UpsertResult } from '../output'
import { validateRecord, type Issue } from '../validation'
import { AuthorStrictSchema, AuthorTransformSchema } from '../validators/authors'
import {
  ModelTokenStatsStrictSchema,
  ModelTokenStatsTransformSchema,
} from '../validators/modelTokenMetrics'

export async function modelTokenMetricsPipeline(
  ctx: ActionCtx,
  {
    snapshot_at,
    models,
    source,
  }:   {
    snapshot_at: number
    run_id: string
    models: (typeof OrModels.$content)[]
    source: {
      authors: (args: { authorSlug: string }) => Promise<unknown>
    }
  },
) {
  const started_at = Date.now()
  const modelTokenMetrics: (typeof OrModelTokenMetrics.$content)[] = []
  const authors: (typeof OrAuthors.$content)[] = []
  const issues: Issue[] = []

  for (const authorSlug of new Set(models.map((m) => m.author_slug))) {
    const data = await source.authors({ authorSlug })

    const { item: metricsItems, issues: metricsIssues } = validateRecord(
      data,
      ModelTokenStatsTransformSchema,
      ModelTokenStatsStrictSchema,
    )
    issues.push(...metricsIssues)
    modelTokenMetrics.push(...metricsItems)

    const { item: authorItem, issues: authorIssues } = validateRecord(
      data,
      AuthorTransformSchema,
      AuthorStrictSchema,
    )
    issues.push(...authorIssues)
    authors.push({ ...authorItem, snapshot_at })
  }

  const results = await ctx.runMutation(internal.openrouter.entities.authors.upsert, {
    items: authors,
  })

  // NOTE: keep same permaslug metrics together - 91 * 22 = 2002
  const byPermaslug = [...Map.groupBy(modelTokenMetrics, (m) => m.model_permaslug).values()]
  const modelTokenMetricsResults = await batch(
    { items: byPermaslug, batchSize: 22 },
    async (items) => {
      return await ctx.runMutation(internal.openrouter.entities.modelTokenMetrics.upsert, {
        items: items.flat(),
      })
    },
  ).then((results) => {
    return { ...R.countBy(results, (v: UpsertResult) => v.action), name: 'modelTokenMetrics' }
  })

  // * model aggregate stats
  const modelStatsEntries = [
    ...Map.groupBy(modelTokenMetrics, (m) => m.model_permaslug).entries(),
  ].map(([permaslug, metrics]) => {
    const stats = Object.fromEntries(
      Map.groupBy(metrics, (m) => m.model_variant)
        .entries()
        .map(([variant, variantMetrics]) => {
          const stats7d = aggregateTokenMetrics({ metrics: variantMetrics, days: 7 })
          const stats30d = aggregateTokenMetrics({ metrics: variantMetrics, days: 30 })
          const stats90d = aggregateTokenMetrics({ metrics: variantMetrics, days: 90 })

          return [
            variant,
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
    )

    return { permaslug, stats }
  })

  // Update models with aggregated stats
  await ctx.runMutation(internal.openrouter.entities.models.updateStats, {
    items: modelStatsEntries,
  })

  return {
    data: undefined,
    metrics: {
      entities: [
        {
          ...R.countBy(results, (v: UpsertResult) => v.action),
          name: 'authors',
        },
        modelTokenMetricsResults,
      ],
      issues,
      started_at,
      ended_at: Date.now(),
    },
  }
}

function aggregateTokenMetrics({
  metrics,
  days,
  now = Date.now(),
}: {
  metrics: Array<{
    timestamp: number
    input_tokens: number
    output_tokens: number
    request_count: number
  }>
  days: number
  now?: number
}) {
  const timePeriod = days * 24 * 60 * 60 * 1000
  const cutoff = now - timePeriod
  const filteredMetrics = metrics.filter((m) => m.timestamp >= cutoff)

  return {
    tokens: filteredMetrics.reduce((sum, m) => sum + m.input_tokens + m.output_tokens, 0),
    requests: filteredMetrics.reduce((sum, m) => sum + m.request_count, 0),
  }
}
