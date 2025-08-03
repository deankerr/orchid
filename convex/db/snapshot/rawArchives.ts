import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation } from '../../_generated/server'

export const table = defineTable({
  run_id: v.string(),
  path: v.string(), // path + search params
  storage_id: v.id('_storage'),
}).index('by_run_id', ['run_id'])

export const insert = internalMutation({
  args: {
    runId: v.string(),
    path: v.string(),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('snapshot_raw_archives', {
      run_id: args.runId,
      path: args.path,
      storage_id: args.storageId,
    })
  },
})
