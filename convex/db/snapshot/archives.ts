import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalQuery, query } from '../../_generated/server'
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
})
  .index('by_snapshot_at', ['snapshot_at'])
  .index('by_run_id', ['run_id'])

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

export const getByRunIdTypeParams = internalQuery({
  args: {
    run_id: v.string(),
    type: v.string(),
    params: v.optional(v.string()),
  },
  handler: async (ctx, { run_id, type, params }) => {
    return await ctx.db
      .query(vTable.name)
      .withIndex('by_run_id', (q) => q.eq('run_id', run_id))
      // filter is ok here for the small amount of docs per run
      .filter((q) => q.and(q.eq(q.field('type'), type), q.eq(q.field('params'), params)))
      .first()
  },
})

export const getById = internalQuery({
  args: {
    id: v.id('snapshot_archives'),
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
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
