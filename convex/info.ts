import { v } from 'convex/values'
import * as R from 'remeda'

import { internalQuery } from './_generated/server'
import { Entities } from './openrouter/registry'

export const snapshotAppCounts = internalQuery({
  args: { limit: v.number(), permaslug: v.string(), variant: v.string() },
  handler: async (ctx, { limit, permaslug, variant }) => {
    const metrics = await ctx.db
      .query(Entities.appTokenMetrics.table.name)
      .withIndex('by_permaslug_variant_snapshot_at', (q) =>
        q.eq('model_permaslug', permaslug).eq('model_variant', variant),
      )
      .order('desc')
      .take(limit)

    const counts = R.countBy(metrics, (m) => m.snapshot_at)
    console.log(counts)
  },
})
