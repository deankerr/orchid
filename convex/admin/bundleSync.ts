import { v } from 'convex/values'
import { z } from 'zod'

import { up } from 'up-fetch'

import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { getEnv } from '../lib/utils'

export const syncRecent = internalAction({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 10 }) => {
    const hostUrl = getEnv('ARCHIVE_SYNC_URL')
    const syncKey = getEnv('ARCHIVE_SYNC_KEY')

    const upFetch = up(fetch, () => ({
      baseUrl: hostUrl,
      headers: {
        'x-sync-key': syncKey,
      },
      retry: {
        attempts: 2,
        delay: (ctx) => ctx.attempt ** 2 * 1000,
      },
    }))

    // Fetch recent archives from production
    const archives = await upFetch('/sync/archives', {
      schema: z
        .record(z.string(), z.any())
        .array()
        .transform((arr) => arr.slice(0, limit)),
    })

    // Process from oldest to newest
    const sortedArchives = archives.sort((a, b) => parseInt(a.crawl_id) - parseInt(b.crawl_id))

    let syncedCount = 0
    for (const archive of sortedArchives) {
      // Check if we already have this crawl_id
      const existing = await ctx.runQuery(internal.db.snapshot.crawl.archives.getByCrawlId, {
        crawl_id: archive.crawl_id,
      })

      if (existing) {
        console.log(`Skipping ${archive.crawl_id} - already exists`)
        continue
      }

      console.log(`Syncing ${archive.crawl_id}`)

      // Download the bundle
      const bundleBuffer = await upFetch(`/sync/archive`, {
        params: {
          crawl_id: archive.crawl_id,
        },
        parseResponse: (res) => res.arrayBuffer(),
      })

      const blob = new Blob([bundleBuffer])
      const storage_id = await ctx.storage.store(blob)

      // Modify the record data
      const { _id, _creationTime, ...originalData } = archive.data
      const modifiedData = {
        ...originalData,
        sourceId: _id,
        sourceCreationTime: _creationTime,
      }

      // Insert the archive record
      await ctx.runMutation(internal.db.snapshot.crawl.archives.insert, {
        crawl_id: archive.crawl_id,
        storage_id,
        data: modifiedData,
      })

      syncedCount++
      console.log(`Successfully synced ${archive.crawl_id}`)
    }

    return { syncedCount, total: archives.length }
  },
})
