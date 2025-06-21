import { Table } from 'convex-helpers/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'

import { diff } from 'json-diff-ts'

import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { MergeResult } from '../types'

export const OrEndpointMetrics = Table('or_endpoint_metrics', {
  endpoint_uuid: v.string(),
  p50_latency: v.number(),
  p50_throughput: v.number(),
  request_count: v.number(),

  snapshot_at: v.number(),
})

export type OrEndpointMetricsFields = Infer<
  AsObjectValidator<typeof OrEndpointMetrics.withoutSystemFields>
>

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

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    })
  },

  merge: async (
    ctx: MutationCtx,
    { endpointMetrics }: { endpointMetrics: OrEndpointMetricsFields },
  ): Promise<MergeResult> => {
    const existing = await OrEndpointMetricsFn.get(ctx, {
      endpoint_uuid: endpointMetrics.endpoint_uuid,
      snapshot_at: endpointMetrics.snapshot_at,
    })
    const changes = OrEndpointMetricsFn.diff(existing || {}, endpointMetrics)

    // new stats
    if (!existing) {
      const docId = await ctx.db.insert(OrEndpointMetrics.name, endpointMetrics)
      return {
        action: 'insert' as const,
        docId,
        changes,
      }
    }

    // existing stats
    if (changes.length === 0) {
      return {
        action: 'stable' as const,
        docId: existing._id,
        changes,
      }
    }

    await ctx.db.replace(existing._id, endpointMetrics)
    return {
      action: 'replace' as const,
      docId: existing._id,
      changes,
    }
  },
}
