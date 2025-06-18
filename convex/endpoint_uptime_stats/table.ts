import { Table } from 'convex-helpers/server'
import type { WithoutSystemFields } from 'convex/server'
import { v, type Infer } from 'convex/values'
import { diff } from 'json-diff-ts'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { MergeResult } from '../types'

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
    { endpointUptimeStats }: { endpointUptimeStats: EndpointUptimeStats },
  ): Promise<MergeResult> => {
    const existing = await EndpointUptimeStatsFn.get(ctx, {
      endpoint_uuid: endpointUptimeStats.endpoint_uuid,
      timestamp: endpointUptimeStats.timestamp,
    })
    const changes = EndpointUptimeStatsFn.diff(existing || {}, endpointUptimeStats)

    // new uptime stats
    if (!existing) {
      const _id = await ctx.db.insert(EndpointUptimeStats.name, endpointUptimeStats)
      return {
        action: 'insert' as const,
        _id,
        diff: changes,
      }
    }

    // existing uptime stats
    if (changes.length === 0) {
      return {
        action: 'stable' as const,
        _id: existing._id,
        diff: changes,
      }
    }

    await ctx.db.replace(existing._id, endpointUptimeStats)
    return {
      action: 'replace' as const,
      _id: existing._id,
      diff: changes,
    }
  },

  mergeTimeSeries: async (
    ctx: MutationCtx,
    { endpointUptimesSeries }: { endpointUptimesSeries: EndpointUptimeStats[] },
  ) => {
    const uptimesByUuid = [...Map.groupBy(endpointUptimesSeries, (u) => u.endpoint_uuid).values()]

    const resultsByUuid = await Promise.all(
      uptimesByUuid.map(async (uptimes) => {
        // later -> earlier
        uptimes.sort((a, b) => b.timestamp - a.timestamp)

        const results: MergeResult[] = []
        for (const uptime of uptimes) {
          const result = await EndpointUptimeStatsFn.merge(ctx, {
            endpointUptimeStats: uptime,
          })
          results.push(result)

          if (result.action === 'stable') break // we already have this + all earlier entries
        }

        return results
      }),
    )
    return resultsByUuid.flat()
  },
}
