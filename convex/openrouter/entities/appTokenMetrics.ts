import { v } from 'convex/values'

import { diff } from 'json-diff-ts'

import { type QueryCtx } from '../../_generated/server'
import { Table2 } from '../../table2'

export const OrAppTokenMetrics = Table2('or_app_token_metrics', {
  app_id: v.number(),
  total_tokens: v.number(),
  model_slug: v.string(),
  model_permaslug: v.string(),
  model_variant: v.string(),

  snapshot_at: v.number(),
})

export const OrAppTokenMetricsFn = {
  get: async (
    ctx: QueryCtx,
    {
      app_id,
      permaslug,
      variant,
      snapshot_at,
    }: { app_id: number; permaslug: string; variant: string; snapshot_at: number },
  ) => {
    return await ctx.db
      .query(OrAppTokenMetrics.name)
      .withIndex('by_app_id_permaslug_variant_snapshot_at', (q) =>
        q
          .eq('app_id', app_id)
          .eq('model_permaslug', permaslug)
          .eq('model_variant', variant)
          .eq('snapshot_at', snapshot_at),
      )
      .first()
  },

  diff: (a: unknown, b: unknown) =>
    diff(a, b, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    }),
}
