import { Table } from 'convex-helpers/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'
import { diff } from 'json-diff-ts'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { MergeResult } from '../types'

export const OrEndpointUptimeMetrics = Table('or_endpoint_uptime_metrics', {
  endpoint_uuid: v.string(),
  uptime: v.optional(v.number()),

  timestamp: v.number(),
})

export type OrEndpointUptimeMetricsFields = Infer<
  AsObjectValidator<typeof OrEndpointUptimeMetrics.withoutSystemFields>
>

export const OrEndpointUptimeMetricsFn = {
  get: async (ctx: QueryCtx, { endpoint_uuid, timestamp }: { endpoint_uuid: string; timestamp: number }) => {
    return await ctx.db
      .query(OrEndpointUptimeMetrics.name)
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
    { endpointUptimeMetrics }: { endpointUptimeMetrics: OrEndpointUptimeMetricsFields },
  ): Promise<MergeResult> => {
    const existing = await OrEndpointUptimeMetricsFn.get(ctx, {
      endpoint_uuid: endpointUptimeMetrics.endpoint_uuid,
      timestamp: endpointUptimeMetrics.timestamp,
    })
    const changes = OrEndpointUptimeMetricsFn.diff(existing || {}, endpointUptimeMetrics)

    // new uptime stats
    if (!existing) {
      const docId = await ctx.db.insert(OrEndpointUptimeMetrics.name, endpointUptimeMetrics)
      return {
        action: 'insert' as const,
        docId,
        changes,
      }
    }

    // existing uptime stats
    if (changes.length === 0) {
      return {
        action: 'stable' as const,
        docId: existing._id,
        changes,
      }
    }

    await ctx.db.replace(existing._id, endpointUptimeMetrics)
    return {
      action: 'replace' as const,
      docId: existing._id,
      changes,
    }
  },

  mergeTimeSeries: async (
    ctx: MutationCtx,
    { endpointUptimesSeries }: { endpointUptimesSeries: OrEndpointUptimeMetricsFields[] },
  ) => {
    const uptimesByUuid = [...Map.groupBy(endpointUptimesSeries, (u) => u.endpoint_uuid).values()]

    const resultsByUuid = await Promise.all(
      uptimesByUuid.map(async (uptimes) => {
        // later -> earlier
        uptimes.sort((a, b) => b.timestamp - a.timestamp)

        const results: MergeResult[] = []
        for (const uptime of uptimes) {
          const result = await OrEndpointUptimeMetricsFn.merge(ctx, {
            endpointUptimeMetrics: uptime,
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
