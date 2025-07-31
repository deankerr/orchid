import { v } from 'convex/values'

import { internalMutation } from '../_generated/server'

// * Simple generic mutations that just do what they're told

export const insert = internalMutation({
  args: { table: v.string(), item: v.any() },
  returns: v.null(),
  handler: async (ctx, { table, item }) => {
    await ctx.db.insert(table as any, item)
    return null
  },
})

export const update = internalMutation({
  args: { table: v.string(), _id: v.any(), item: v.any() },
  returns: v.null(),
  handler: async (ctx, { _id, item }) => {
    await ctx.db.replace(_id, item)
    return null
  },
})