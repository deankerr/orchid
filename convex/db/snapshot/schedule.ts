import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { fnQueryLite } from '../../fnHelperLite'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  enabled: v.boolean(),
  interval_hours: v.number(),
  delay_minutes: v.number(),
  jitter_minutes: v.number(),
})

export const vTable = createTableVHelper('snapshot_schedule', table.validator)

// * queries
export const getLatest = fnQueryLite({
  handler: async (ctx) => {
    return await ctx.db.query(vTable.name).order('desc').first()
  },
})