import { v } from 'convex/values'

import { diff } from 'json-diff-ts'

import { type QueryCtx } from '../../_generated/server'
import { Table2 } from '../../table2'

export const OrEndpointMetrics = Table2('or_endpoint_metrics', {
  endpoint_uuid: v.string(),
  p50_latency: v.number(),
  p50_throughput: v.number(),
  request_count: v.number(), // ~ last 24 hours

  snapshot_at: v.number(),
})

export const OrEndpointMetricsFn = {
  get: async (
    ctx: QueryCtx,
    { endpoint_uuid, snapshot_at }: { endpoint_uuid: string; snapshot_at: number },
  ) => {
    return await ctx.db
      .query(OrEndpointMetrics.name)
      .withIndex('by_endpoint_uuid_snapshot_at', (q) =>
        q.eq('endpoint_uuid', endpoint_uuid).eq('snapshot_at', snapshot_at),
      )
      .first()
  },

  diff: (a: unknown, b: unknown) =>
    diff(a, b, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    }),
}
