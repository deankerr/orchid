import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'

import { internal } from './_generated/api'
import { internalAction, internalQuery } from './_generated/server'
import { getErrorMessage } from './shared'

export const deleteFiles = internalAction({
  args: {
    storageIds: v.array(v.id('_storage')),
  },
  handler: async (ctx, { storageIds }) => {
    await asyncMap(storageIds, async (storageId) => {
      try {
        await ctx.storage.delete(storageId)
      } catch (err) {
        console.error('[deleteFiles]', getErrorMessage(err))
      }
    })
  },
})

export const dev_deleteRange = internalAction({
  handler: async (ctx) => {
    const ids = await ctx.runQuery(internal.storage.dev_deleteRangeQuery)
    if (!ids.length) return

    for (const id of ids) {
      await ctx.storage.delete(id)
    }

    console.log('deleted', ids.length)
    await ctx.scheduler.runAfter(0, internal.storage.dev_deleteRange)
  },
})

export const dev_deleteRangeQuery = internalQuery({
  handler: async (ctx) => {
    const r = await ctx.db.system
      .query('_storage')
      .withIndex('by_creation_time', (q) =>
        q.lt('_creationTime', new Date('07/08/2025, 01:49:37').getTime()),
      )
      .take(8180)
    return r.map((r) => r._id)
  },
})
