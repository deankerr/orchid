import { defineTable } from 'convex/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'
import type { MutationCtx } from '../_generated/server'

export const endpointStatsTable = defineTable({
  endpoint_uuid: v.string(),
  epoch: v.number(),
  p50_latency: v.number(),
  p50_throughput: v.number(),
  request_count: v.number(),
}).index('by_endpoint_uuid_epoch', ['endpoint_uuid', 'epoch'])

export const vEndpointStatsFields = endpointStatsTable.validator.fields

export async function mergeEndpointStats(
  ctx: MutationCtx,
  stats: Infer<AsObjectValidator<typeof vEndpointStatsFields>>,
) {
  const existingStats = await ctx.db
    .query('endpoint_stats_v1')
    .withIndex('by_endpoint_uuid_epoch', (q) =>
      q.eq('endpoint_uuid', stats.endpoint_uuid).eq('epoch', stats.epoch),
    )
    .first()

  if (existingStats) return await ctx.db.replace(existingStats._id, stats)
  return await ctx.db.insert('endpoint_stats_v1', stats)
}
