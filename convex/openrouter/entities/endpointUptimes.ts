import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'

import { internalMutation, type QueryCtx } from '../../_generated/server'
import { Table2 } from '../../table2'

export const OrEndpointUptimes = Table2('or_endpoint_uptimes', {
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
      average: v.optional(v.number()),
    }),
  ),
})

export const OrEndpointUptimesFn = {
  get: async (ctx: QueryCtx, { endpoint_uuid }: { endpoint_uuid: string }) => {
    return await ctx.db
      .query(OrEndpointUptimes.name)
      .withIndex('by_endpoint_uuid_snapshot_at', (q) => q.eq('endpoint_uuid', endpoint_uuid))
      .first()
  },

  // Rolling window logic for maintaining 72 hours of data
  // Guarantees exactly max 72 data points by keeping the most recent entries
  updateHourlyData: (
    existingData: Array<{ timestamp: number; uptime?: number }>,
    newData: Array<{ timestamp: number; uptime?: number }>,
  ) => {
    // Combine existing and new data
    const combined = [...existingData, ...newData]

    // Remove duplicates by timestamp (prefer newer data)
    const deduplicated = new Map<number, { timestamp: number; uptime?: number }>()
    for (const item of combined) {
      deduplicated.set(item.timestamp, item)
    }

    // Sort by timestamp and keep only the most recent 72 entries
    return Array.from(deduplicated.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-72) // Keep only the most recent 72 data points
  },

  // Calculate 30 day rolling daily averages
  // Guarantees exactly max 30 data points by keeping the most recent daily averages
  updateDailyAverages: (
    existingDailyAverages: Array<{ timestamp: number; average?: number }>,
    hourlyData: Array<{ timestamp: number; uptime?: number }>,
  ) => {
    // Group hourly data by day
    const dailyGroups = new Map<number, Array<{ timestamp: number; uptime?: number }>>()

    for (const item of hourlyData) {
      const dayStart = new Date(item.timestamp)
      dayStart.setUTCHours(0, 0, 0, 0)
      const dayTimestamp = dayStart.getTime()

      if (!dailyGroups.has(dayTimestamp)) {
        dailyGroups.set(dayTimestamp, [])
      }
      dailyGroups.get(dayTimestamp)!.push(item)
    }

    // Calculate daily averages
    const newDailyAverages = Array.from(dailyGroups.entries()).map(([timestamp, items]) => {
      const validUptimes = items.filter((item) => item.uptime !== undefined && item.uptime !== null)
      const average =
        validUptimes.length > 0
          ? validUptimes.reduce((sum, item) => sum + item.uptime!, 0) / validUptimes.length
          : undefined

      return { timestamp, average }
    })

    // Combine with existing daily averages
    const combined = [...existingDailyAverages, ...newDailyAverages]

    // Deduplicate by date (prefer newer calculations)
    const deduplicated = new Map<number, { timestamp: number; average?: number }>()
    for (const item of combined) {
      deduplicated.set(item.timestamp, item)
    }

    // Sort by date and keep only the most recent 30 daily averages
    return Array.from(deduplicated.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-30) // Keep only the most recent 30 daily averages
  },
}

export const upsert = internalMutation({
  args: {
    items: v.array(OrEndpointUptimes.content),
  },
  // Maintains rolling windows with hard guarantees: max 72 hourly + max 30 daily data points
  handler: async (ctx, { items }) => {
    const results = await asyncMap(items, async (item) => {
      const existing = await OrEndpointUptimesFn.get(ctx, { endpoint_uuid: item.endpoint_uuid })

      if (existing) {
        // Merge with existing data using rolling window logic
        const latest_72h = OrEndpointUptimesFn.updateHourlyData(
          existing.latest_72h,
          item.latest_72h,
        )
        const average_30d = OrEndpointUptimesFn.updateDailyAverages(
          existing.average_30d,
          latest_72h,
        )

        // Update existing document
        await ctx.db.replace(existing._id, {
          ...item,
          latest_72h,
          average_30d,
        })

        return { action: 'update' as const }
      } else {
        // Calculate initial daily averages from hourly data
        const average_30d = OrEndpointUptimesFn.updateDailyAverages([], item.latest_72h)

        // Create new document
        await ctx.db.insert(OrEndpointUptimes.name, {
          ...item,
          average_30d,
        })

        return { action: 'insert' as const }
      }
    })

    return results
  },
})
