import { v } from 'convex/values'

import { diff } from 'json-diff-ts'

import { type QueryCtx } from '../../_generated/server'
import { Table2 } from '../../table2'

export const OrEndpointUptimeMetrics = Table2('or_endpoint_uptime_metrics', {
  endpoint_uuid: v.string(),
  uptime: v.optional(v.number()),

  timestamp: v.number(),
})

export const OrEndpointUptimeMetricsFn = {
  get: async (
    ctx: QueryCtx,
    { endpoint_uuid, timestamp }: { endpoint_uuid: string; timestamp: number },
  ) => {
    return await ctx.db
      .query(OrEndpointUptimeMetrics.name)
      .withIndex('by_endpoint_uuid_timestamp', (q) =>
        q.eq('endpoint_uuid', endpoint_uuid).eq('timestamp', timestamp),
      )
      .first()
  },

  diff: (a: unknown, b: unknown) =>
    diff(a, b, {
      keysToSkip: ['_id', '_creationTime'],
    }),
}
