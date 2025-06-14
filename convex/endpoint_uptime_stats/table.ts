import { Table } from 'convex-helpers/server'
import type { WithoutSystemFields } from 'convex/server'
import { v, type Infer } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { diff } from 'json-diff-ts'

export const EndpointUptimeStats = Table('endpoint_uptime_stats', {
  endpoint_uuid: v.string(),
  timestamp: v.number(),
  uptime: v.optional(v.number()),
})

export type EndpointUptimeStatsDoc = Infer<typeof EndpointUptimeStats.doc>
export type EndpointUptimeStats = WithoutSystemFields<EndpointUptimeStatsDoc>

export const EndpointUptimeStatsFn = {
  get: async (ctx: QueryCtx, { endpoint_uuid, timestamp }: { endpoint_uuid: string; timestamp: number }) => {
    return await ctx.db
      .query(EndpointUptimeStats.name)
      .withIndex('by_endpoint_uuid_timestamp', (q) =>
        q.eq('endpoint_uuid', endpoint_uuid).eq('timestamp', timestamp),
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
    { endpointUptimeStats }: { endpointUptimeStats: EndpointUptimeStatsDoc },
  ) => {
    const existing = await EndpointUptimeStatsFn.get(ctx, {
      endpoint_uuid: endpointUptimeStats.endpoint_uuid,
      timestamp: endpointUptimeStats.timestamp,
    })
    const diff = EndpointUptimeStatsFn.diff(existing || {}, endpointUptimeStats)

    if (existing) {
      await ctx.db.replace(existing._id, endpointUptimeStats)
      return {
        action: 'replace' as const,
        _id: existing._id,
        diff,
      }
    }

    const _id = await ctx.db.insert(EndpointUptimeStats.name, endpointUptimeStats)
    return {
      action: 'insert' as const,
      _id,
      diff,
    }
  },
}
