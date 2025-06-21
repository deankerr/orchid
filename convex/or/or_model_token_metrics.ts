import { Table } from 'convex-helpers/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'

import { diff } from 'json-diff-ts'

import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { MergeResult } from '../types'

export const OrModelTokenMetrics = Table('or_model_token_metrics', {
  model_slug: v.string(),
  model_permaslug: v.string(),
  model_variant: v.string(),

  input_tokens: v.number(),
  output_tokens: v.number(),
  reasoning_tokens: v.number(),
  request_count: v.number(),

  timestamp: v.number(),
})

export type OrModelTokenMetricsFields = Infer<
  AsObjectValidator<typeof OrModelTokenMetrics.withoutSystemFields>
>

export const OrModelTokenMetricsFn = {
  get: async (
    ctx: QueryCtx,
    {
      model_permaslug,
      model_variant,
      timestamp,
    }: { model_permaslug: string; model_variant: string; timestamp: number },
  ) => {
    return await ctx.db
      .query(OrModelTokenMetrics.name)
      .withIndex('by_model_permaslug_model_variant_timestamp', (q) =>
        q
          .eq('model_permaslug', model_permaslug)
          .eq('model_variant', model_variant)
          .eq('timestamp', timestamp),
      )
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime'],
    })
  },

  merge: async (
    ctx: MutationCtx,
    { modelTokenMetrics }: { modelTokenMetrics: OrModelTokenMetricsFields },
  ): Promise<MergeResult> => {
    const existing = await OrModelTokenMetricsFn.get(ctx, {
      model_permaslug: modelTokenMetrics.model_permaslug,
      model_variant: modelTokenMetrics.model_variant,
      timestamp: modelTokenMetrics.timestamp,
    })
    const changes = OrModelTokenMetricsFn.diff(existing || {}, modelTokenMetrics)

    // new token stats
    if (!existing) {
      const docId = await ctx.db.insert(OrModelTokenMetrics.name, modelTokenMetrics)
      return {
        action: 'insert' as const,
        docId,
        changes,
      }
    }

    // existing token stats
    if (changes.length === 0) {
      return {
        action: 'stable' as const,
        docId: existing._id,
        changes,
      }
    }

    await ctx.db.replace(existing._id, modelTokenMetrics)
    return {
      action: 'replace' as const,
      docId: existing._id,
      changes,
    }
  },

  mergeTimeSeries: async (
    ctx: MutationCtx,
    { modelTokenMetrics }: { modelTokenMetrics: OrModelTokenMetricsFields[] },
  ) => {
    // stats come mixed up from the API, group them here
    const byPermaslugVariant = Map.groupBy(
      modelTokenMetrics,
      (stat) => stat.model_permaslug + ' ' + stat.model_variant,
    ).values()

    const resultsByPermaslugVariant = await Promise.all(
      byPermaslugVariant.map(async (modelTokenMetrics) => {
        // latest -> earliest
        modelTokenMetrics.sort((a, b) => a.timestamp - b.timestamp)

        const results: MergeResult[] = []
        for (const stat of modelTokenMetrics) {
          const result = await OrModelTokenMetricsFn.merge(ctx, { modelTokenMetrics: stat })
          results.push(result)

          if (result.action === 'stable') break // we already have this + all earlier entries
        }

        return results
      }),
    )

    return resultsByPermaslugVariant.flat()
  },
}
