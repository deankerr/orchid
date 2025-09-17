import { v } from 'convex/values'

import { api, internal } from '../../_generated/api'
import type { Doc } from '../../_generated/dataModel'
import { internalAction } from '../../_generated/server'
import { shouldDisplayChange } from './display'

const BATCH_SIZE = 4000

export const reprocessDisplayStatus = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx, _args) => {
    let processed = 0
    let updated = 0
    let cursor: string | null = null

    while (true) {
      // * fetch next batch of changes
      const result: { page: Doc<'or_changes'>[]; continueCursor: string | null; isDone: boolean } =
        await ctx.runQuery(api.db.or.changes.list, {
          paginationOpts: {
            numItems: BATCH_SIZE,
            cursor,
          },
        })

      const { page: changes, continueCursor, isDone } = result

      if (changes.length === 0) {
        break
      }

      // * process changes and collect updates
      const updates = []

      for (const change of changes) {
        const newDisplayStatus = shouldDisplayChange(change)

        if (change.is_display !== newDisplayStatus) {
          updates.push({
            _id: change._id,
            is_display: newDisplayStatus,
          })

          console.log('[reprocessDisplay] update', { entity: change.entity_display_name })
        }

        processed++
      }

      // * apply updates if any
      if (updates.length > 0) {
        await ctx.runMutation(internal.db.or.changes.updateDisplayStatus, {
          updates,
        })
        updated += updates.length
      }

      console.log('[reprocessDisplay]', { processed, updated })

      if (isDone) {
        break
      }

      cursor = continueCursor
    }

    return null
  },
})
