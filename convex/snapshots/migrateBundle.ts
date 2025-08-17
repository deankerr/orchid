import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'

const RAW_ARCHIVE_DELETE_BATCH = 200

export const cleanupRawArchivesLoop = internalAction({
  args: {},
  handler: async (ctx) => {
    const batch = await ctx.runQuery(internal.db.snapshot.rawArchives.getBatch, {
      limit: RAW_ARCHIVE_DELETE_BATCH,
    })

    if (!batch.length) {
      console.log('[migrate:cleanupRawArchives] complete')
      return
    }

    let storageDeleted = 0
    for (const row of batch) {
      try {
        await ctx.storage.delete(row.storage_id)
        storageDeleted++
      } catch (err) {
        console.error('[migrate:cleanupRawArchives.delete.storage]', {
          storage_id: row.storage_id,
          error: (err as Error).message,
        })
      }
    }

    const ids = batch.map((r) => r._id)
    await ctx.runMutation(internal.db.snapshot.rawArchives.deleteMany, { ids })

    console.log('[migrate:cleanupRawArchives] progress', {
      batch: batch.length,
      storageDeleted,
      remaining: 'unknown',
    })

    await ctx.scheduler.runAfter(0, internal.snapshots.migrateBundle.cleanupRawArchivesLoop, {})
  },
})
