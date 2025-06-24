import { v } from 'convex/values'

import { internalQuery } from './_generated/server'
import { OrAppTokenMetrics } from './or/or_app_token_metrics'

export const snapshotAppCounts = internalQuery({
  args: { snapshot_at: v.number() },
  handler: async (ctx, { snapshot_at }) => {
    const metrics = await ctx.db
      .query(OrAppTokenMetrics.name)
      .withIndex('by_snapshot_at', (q) => q.eq('snapshot_at', snapshot_at))
      .collect()
    const map = Map.groupBy(metrics, (m) => `${m.model_slug}:${m.model_variant}`)
    const sorted = [...map.entries()].sort((a, b) => b[1].length - a[1].length)
    return sorted.map(([key, value]) => ({
      key,
      value: value.length,
    })) as { key: string; value: number }[]
  },
})
