import type { ActionCtx } from '../../_generated/server'
import { output } from '../output'
import type { Entities } from '../registry'
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
  }: {
    snapshot_at: number
    run_id: string
    models: (typeof Entities.models.table.$content)[]
    source: {
      authors: (args: { authorSlug: string }) => Promise<unknown>
    }
  },
) {
  const started_at = Date.now()
  const modelTokenMetrics: (typeof Entities.modelTokenMetrics.table.$content)[] = []
  const authors: (typeof Entities.authors.table.$content)[] = []
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

  const results = await output(ctx, {
    entities: [
      {
        name: 'modelTokenMetrics',
        items: modelTokenMetrics,
      },
      {
        name: 'authors',
        items: authors,
      },
    ],
  })

  return {
    data: undefined,
    metrics: {
      entities: results,
      issues,
      started_at,
      ended_at: Date.now(),
    },
  }
}
