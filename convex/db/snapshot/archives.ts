import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { fnMutationLite, fnQueryLite } from '../../fnHelperLite'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  run_id: v.string(),
  snapshot_at: v.number(),
  type: v.string(), // e.g. models/endpoints
  params: v.optional(v.string()),
  size: v.number(), // original
  storage_id: v.id('_storage'),
  sha256: v.string(),
}).index('by_snapshot_at', ['snapshot_at'])

export const vTable = createTableVHelper('snapshot_archives', table.validator)

// * queries
export const queryBySnapshotAt = fnQueryLite({
  args: {
    snapshot_at: v.number(),
    type: v.string(),
  },
  handler: async (ctx, { snapshot_at, type }) => {
    return await ctx.db
      .query(vTable.name)
      .withIndex('by_snapshot_at', (q) => q.eq('snapshot_at', snapshot_at))
      .filter((q) => q.eq(q.field('type'), type))
      .collect()
  },
})

export const getBySnapshotAt = fnQueryLite({
  args: {
    snapshot_at: v.number(),
  },
  handler: async (ctx, { snapshot_at }) => {
    return await ctx.db
      .query(vTable.name)
      .withIndex('by_snapshot_at', (q) => q.eq('snapshot_at', snapshot_at))
      .order('desc')
      .collect()
  },
})

// * mutations
export const insert = fnMutationLite({
  args: vTable.validator.fields,
  handler: async (ctx, args) => {
    return await ctx.db.insert(vTable.name, args)
  },
})

// Legacy name for backward compatibility
export const insertArchiveRecord = insert
