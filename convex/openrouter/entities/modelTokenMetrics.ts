import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'

import { diff } from 'json-diff-ts'

import { internalMutation, type QueryCtx } from '../../_generated/server'
import { Table2 } from '../../table2'
import type { UpsertResult } from '../output'

export const OrModelTokenMetrics = Table2('or_model_token_metrics', {
  model_slug: v.string(),
  model_permaslug: v.string(),
  model_variant: v.string(),

  input_tokens: v.number(),
  output_tokens: v.number(),
  reasoning_tokens: v.number(),
  request_count: v.number(),

  timestamp: v.number(),
})

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
      .withIndex('by_model_permaslug_variant_timestamp', (q) =>
        q
          .eq('model_permaslug', model_permaslug)
          .eq('model_variant', model_variant)
          .eq('timestamp', timestamp),
      )
      .first()
  },

  diff: (a: unknown, b: unknown) =>
    diff(a, b, {
      keysToSkip: ['_id', '_creationTime'],
    }),
}

export const upsert = internalMutation({
  args: {
    items: v.array(OrModelTokenMetrics.content),
  },
  handler: async (ctx, { items }) => {
    const byPermaslugVariant = [
      ...Map.groupBy(items, (m) => m.model_permaslug + ' ' + m.model_variant).values(),
    ]

    const resultsByPermaslugVariant = await asyncMap(
      byPermaslugVariant,
      async (modelTokenMetrics) => {
        // latest -> earliest
        modelTokenMetrics.sort((a, b) => b.timestamp - a.timestamp)

        const results: UpsertResult[] = []
        for (const metric of modelTokenMetrics) {
          const existing = await ctx.db
            .query(OrModelTokenMetrics.name)
            .withIndex('by_permaslug_timestamp', (q) =>
              q.eq('model_permaslug', metric.model_permaslug).eq('timestamp', metric.timestamp),
            )
            .filter((q) => q.eq(q.field('model_variant'), metric.model_variant))
            .first()

          if (existing) {
            if (OrModelTokenMetricsFn.diff(existing, metric).length === 0) {
              results.push({ action: 'stable' })
              break // we already have this + all earlier entries
            }

            await ctx.db.patch(existing._id, metric)
            results.push({ action: 'update' })
          } else {
            await ctx.db.insert(OrModelTokenMetrics.name, metric)
            results.push({ action: 'insert' })
          }
        }

        return results
      },
    )

    return resultsByPermaslugVariant.flat()
  },
})
