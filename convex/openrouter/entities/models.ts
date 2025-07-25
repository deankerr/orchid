import { v } from 'convex/values'

import { internalMutation, query } from '../../_generated/server'
import * as ORModels from '../../db/or/models'

// * queries
export const get = query({
  args: {
    slug: v.string(),
  },
  handler: ORModels.get,
})

export const list = query({
  handler: ORModels.list,
})

// * snapshots
export const upsert = internalMutation({
  args: {
    items: v.array(ORModels.vTable.validator),
  },
  handler: ORModels.upsert,
})

export const updateStats = internalMutation({
  args: {
    items: v.array(
      v.object({
        permaslug: v.string(),
        stats: ORModels.vModelStats,
      }),
    ),
  },
  handler: ORModels.updateStats,
})
