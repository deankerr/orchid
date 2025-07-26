import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v, type Infer } from 'convex/values'

import type { QueryCtx } from '../../_generated/server'
import { fnMutationLite } from '../../fnHelperLite'
import { countResults } from '../../openrouter/utils'
import { getDayAlignedTimestamp } from '../../shared'
import { createTableVHelper } from '../../table3'

const vEndpointStat = v.union(
  v.object({
    timestamp: v.number(),
  }),
  v.object({
    timestamp: v.number(),
    p50_latency: v.number(),
    p50_throughput: v.number(),
    request_count: v.number(),
  }),
)
export type EndpointStat = Infer<typeof vEndpointStat>

export const table = defineTable({
  endpoint_uuid: v.string(),
  snapshot_at: v.number(),

  latest_72h: v.array(vEndpointStat),
  average_30d: v.array(vEndpointStat),
}).index('by_endpoint_uuid_snapshot_at', ['endpoint_uuid', 'snapshot_at'])

export const vTable = createTableVHelper('or_endpoint_stats', table.validator)

// Helper: fetch latest stats doc for endpoint
async function getLatestHelper(ctx: QueryCtx, { endpoint_uuid }: { endpoint_uuid: string }) {
  return await ctx.db
    .query('or_endpoint_stats')
    .withIndex('by_endpoint_uuid_snapshot_at', (q) => q.eq('endpoint_uuid', endpoint_uuid))
    .first()
}

function updateHourlyStats(existingData: Array<EndpointStat>, newStat: EndpointStat) {
  // Combine existing and new data
  const combined = [...existingData, newStat]
  // Remove duplicates by timestamp (prefer newer data)
  const deduplicated = new Map<number, EndpointStat>()
  for (const item of combined) {
    deduplicated.set(item.timestamp, item)
  }
  // Sort by timestamp and keep only the most recent 72 entries
  return [...deduplicated.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-72)
}

function updateDailyAverages(
  existingDailyAverages: Array<EndpointStat>,
  hourlyData: Array<EndpointStat>,
) {
  // Group hourly data by day
  const dailyGroups = new Map<number, Array<EndpointStat>>()
  for (const item of hourlyData) {
    const dayTimestamp = getDayAlignedTimestamp(item.timestamp)

    if (!dailyGroups.has(dayTimestamp)) {
      dailyGroups.set(dayTimestamp, [])
    }
    dailyGroups.get(dayTimestamp)!.push(item)
  }
  // Calculate daily averages for each stat
  const newDailyAverages = [...dailyGroups].map(([timestamp, items]) => {
    const valid = items.filter(
      (item) => 'p50_latency' in item && 'p50_throughput' in item && 'request_count' in item,
    )

    if (valid.length === 0) {
      return { timestamp }
    }

    const p50_latency = valid.reduce((sum, i) => sum + i.p50_latency, 0) / valid.length
    const p50_throughput = valid.reduce((sum, i) => sum + i.p50_throughput, 0) / valid.length
    const request_count = valid.reduce((sum, i) => sum + i.request_count, 0) / valid.length

    return { timestamp, p50_latency, p50_throughput, request_count }
  })

  // Combine with existing daily averages
  const combined = [...existingDailyAverages, ...newDailyAverages]

  // Deduplicate by date (prefer newer calculations)
  const deduplicated = new Map<number, EndpointStat>()
  for (const item of combined) {
    deduplicated.set(item.timestamp, item)
  }

  // Sort by date and keep only the most recent 30 daily averages
  return [...deduplicated.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-30)
}

// * snapshots
export const upsert = fnMutationLite({
  args: {
    items: v.array(
      v.object({
        endpoint_uuid: v.string(),
        snapshot_at: v.number(),
        stat: vEndpointStat,
      }),
    ),
  },
  handler: async (ctx, args) => {
    const results = await asyncMap(args.items, async (item) => {
      const existing = await getLatestHelper(ctx, { endpoint_uuid: item.endpoint_uuid })

      if (existing) {
        const latest_72h = updateHourlyStats(existing.latest_72h, item.stat)
        const average_30d = updateDailyAverages(existing.average_30d, latest_72h)
        await ctx.db.replace(existing._id, {
          endpoint_uuid: item.endpoint_uuid,
          snapshot_at: item.snapshot_at,
          latest_72h,
          average_30d,
        })
        return { action: 'update' as const }
      } else {
        // Calculate initial daily averages from hourly data
        const latest_72h = item.stat ? [item.stat] : []
        const average_30d = updateDailyAverages([], latest_72h)
        await ctx.db.insert(vTable.name, {
          endpoint_uuid: item.endpoint_uuid,
          snapshot_at: item.snapshot_at,
          latest_72h,
          average_30d,
        })
        return { action: 'insert' as const }
      }
    })

    return countResults(results, 'endpointStats')
  },
})
