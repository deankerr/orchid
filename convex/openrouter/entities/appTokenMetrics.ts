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
  get: async (ctx: QueryCtx, { app_id, snapshot_at }: { app_id: number; snapshot_at: number }) => {
    return await ctx.db
      .query(OrAppTokenMetrics.name)
      .withIndex('by_app_id_snapshot_at', (q) =>
        q.eq('app_id', app_id).eq('snapshot_at', snapshot_at),
      )
      .first()
  },

  diff: (a: unknown, b: unknown) =>
    diff(a, b, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    }),
}
