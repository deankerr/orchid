import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { fnMutationLite, fnQueryLite } from '../../fnHelperLite'
import { countResults } from '../../openrouter/utils'
import { getDayAlignedTimestamp } from '../../shared'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  endpoint_uuid: v.string(),
  snapshot_at: v.number(),

  // Last 72 hours of hourly data (as returned by upstream)
  latest_72h: v.array(
    v.object({
      timestamp: v.number(),
      uptime: v.optional(v.number()),
    }),
  ),

  // 30 day rolling daily averages
  average_30d: v.array(
    v.object({
      timestamp: v.number(), // day timestamp (start of day)
      uptime: v.optional(v.number()),
    }),
  ),
}).index('by_endpoint_uuid_snapshot_at', ['endpoint_uuid', 'snapshot_at'])

export const vTable = createTableVHelper('or_endpoint_uptimes', table.validator)

function updateHourlyData(
  existingData: Array<{ timestamp: number; uptime?: number }>,
  newData: Array<{ timestamp: number; uptime?: number }>,
) {
  // Combine existing and new data
  const combined = [...existingData, ...newData]

  // Remove duplicates by timestamp (prefer newer data)
  const deduplicated = new Map<number, { timestamp: number; uptime?: number }>()
  for (const item of combined) {
    deduplicated.set(item.timestamp, item)
  }

  // Sort by timestamp and keep only the most recent 72 entries
  return [...deduplicated.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-72)
}

function updateDailyAverages(
  existingDailyAverages: Array<{ timestamp: number; uptime?: number }>,
  hourlyData: Array<{ timestamp: number; uptime?: number }>,
) {
  // Group hourly data by day
  const dailyGroups = new Map<number, Array<{ timestamp: number; uptime?: number }>>()

  for (const item of hourlyData) {
    const dayTimestamp = getDayAlignedTimestamp(item.timestamp)

    if (!dailyGroups.has(dayTimestamp)) {
      dailyGroups.set(dayTimestamp, [])
    }
    dailyGroups.get(dayTimestamp)!.push(item)
  }

  // Calculate daily averages
  const newDailyAverages = [...dailyGroups].map(([timestamp, items]) => {
    const validUptimes = items.filter((item) => item.uptime !== undefined && item.uptime !== null)
    const uptime =
      validUptimes.length > 0
        ? validUptimes.reduce((sum, item) => sum + item.uptime!, 0) / validUptimes.length
        : undefined

    return { timestamp, uptime }
  })

  // Combine with existing daily averages
  const combined = [...existingDailyAverages, ...newDailyAverages]

  // Deduplicate by date (prefer newer calculations)
  const deduplicated = new Map<number, { timestamp: number; uptime?: number }>()
  for (const item of combined) {
    deduplicated.set(item.timestamp, item)
  }

  // Sort by date and keep only the most recent 30 daily averages
  return [...deduplicated.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-30)
}

// * queries
export const getLatest = fnQueryLite({
  args: {
    endpoint_uuid: v.string(),
  },
  handler: async (ctx, { endpoint_uuid }) => {
    return await ctx.db
      .query('or_endpoint_uptimes')
      .withIndex('by_endpoint_uuid_snapshot_at', (q) => q.eq('endpoint_uuid', endpoint_uuid))
      .first()
  },
})

// * snapshots
export const upsert = fnMutationLite({
  args: {
    items: v.array(vTable.validator.omit('average_30d')),
  },
  // Maintains rolling windows with hard guarantees: max 72 hourly + max 30 daily data points
  handler: async (ctx, args) => {
    const results = await asyncMap(args.items, async (item) => {
      const existing = await getLatest.run(ctx, { endpoint_uuid: item.endpoint_uuid })

      if (existing) {
        // Merge with existing data using rolling window logic
        const latest_72h = updateHourlyData(existing.latest_72h, item.latest_72h)
        const average_30d = updateDailyAverages(existing.average_30d, latest_72h)

        // Update existing document
        await ctx.db.replace(existing._id, {
          ...item,
          latest_72h,
          average_30d,
        })

        return { action: 'update' as const }
      } else {
        // Calculate initial daily averages from hourly data
        const average_30d = updateDailyAverages([], item.latest_72h)

        // Create new document
        await ctx.db.insert(vTable.name, {
          ...item,
          average_30d,
        })

        return { action: 'insert' as const }
      }
    })

    return countResults(results, 'endpointUptimes')
  },
})
