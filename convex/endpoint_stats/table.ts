import { Table } from 'convex-helpers/server'
import type { WithoutSystemFields } from 'convex/server'
import { v, type Infer } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { diff } from 'json-diff-ts'
import type { MergeResult } from '../types'

export const EndpointStats = Table('endpoint_stats', {
  endpoint_uuid: v.string(),
  p50_latency: v.number(),
  p50_throughput: v.number(),
  request_count: v.number(),
  epoch: v.number(),
})

export type EndpointStatsDoc = Infer<typeof EndpointStats.doc>
export type EndpointStat = WithoutSystemFields<EndpointStatsDoc>

export const EndpointStatsFn = {
  get: async (ctx: QueryCtx, { endpoint_uuid, epoch }: { endpoint_uuid: string; epoch: number }) => {
    return await ctx.db
      .query(EndpointStats.name)
      .withIndex('by_endpoint_uuid_epoch', (q) => q.eq('endpoint_uuid', endpoint_uuid).eq('epoch', epoch))
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime'],
    })
  },

  merge: async (
    ctx: MutationCtx,
    { endpointStats }: { endpointStats: EndpointStat },
  ): Promise<MergeResult> => {
    const existing = await EndpointStatsFn.get(ctx, {
      endpoint_uuid: endpointStats.endpoint_uuid,
      epoch: endpointStats.epoch,
    })
    const diff = EndpointStatsFn.diff(existing || {}, endpointStats)

    if (existing) {
      if (diff.length === 0) {
        return {
          action: 'stable' as const,
          _id: existing._id,
          diff,
        }
      }

      await ctx.db.replace(existing._id, endpointStats)
      return {
        action: 'replace' as const,
        _id: existing._id,
        diff,
      }
    }

    const _id = await ctx.db.insert(EndpointStats.name, endpointStats)
    return {
      action: 'insert' as const,
      _id,
      diff,
    }
  },
}
