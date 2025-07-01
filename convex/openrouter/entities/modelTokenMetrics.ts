import { v } from 'convex/values'

import { diff } from 'json-diff-ts'

import { type QueryCtx } from '../../_generated/server'
import { Table2 } from '../../table2'

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
