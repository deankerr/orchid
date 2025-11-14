import { WithoutSystemFields } from 'convex/server'
import { z } from 'zod'

import { up } from 'up-fetch'

import { internal } from '../_generated/api'
import { Doc } from '../_generated/dataModel'
import { httpAction, internalAction } from '../_generated/server'
import { getEnv } from '../lib/utils'

// * Client
type IncomingArchive = WithoutSystemFields<Doc<'snapshot_crawl_archives'>> & {
  _id: string
  _creationTime: number
}

export const syncRecent = internalAction({
  args: {},
  handler: async (ctx) => {
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
        .transform((arr) => arr as IncomingArchive[]),
    })

    const latestCrawlId = await ctx.runQuery(internal.db.snapshot.crawl.archives.getLatestCrawlId)
    console.log({ latestCrawlId, archives: archives.map((a) => a.crawl_id) })

    // Filter out archives older than the latest crawl_id
    const filteredArchives = latestCrawlId
      ? archives.filter((archive) => parseInt(archive.crawl_id) > parseInt(latestCrawlId))
      : archives

    // Process from oldest to newest
    const sortedArchives = filteredArchives.sort(
      (a, b) => parseInt(a.crawl_id) - parseInt(b.crawl_id),
    )

    let syncedCount = 0
    for (const archive of sortedArchives) {
      // Download the bundle
      const bundleBuffer = await upFetch(`/sync/bundle`, {
        params: {
          crawl_id: archive.crawl_id,
        },
        parseResponse: (res) => res.arrayBuffer(),
      })

      const blob = new Blob([bundleBuffer])
      const storage_id = await ctx.storage.store(blob)

      // Modify the record data
      const { _id, _creationTime, data } = archive
      const modifiedData = {
        ...data,
        origin: {
          id: _id,
          creationTime: _creationTime,
        },
      }

      // Insert the archive record
      await ctx.runMutation(internal.db.snapshot.crawl.archives.insert, {
        crawl_id: archive.crawl_id,
        storage_id,
        data: modifiedData,
      })

      syncedCount++
    }

    console.log('[bundleSync]', { syncedCount, total: archives.length })
  },
})

// * Server
// Archive sync endpoints for dev/preview environments
const SYNC_RECORDS_LIMIT = 72

function validateSyncKey(req: Request): boolean {
  const SYNC_KEY = getEnv('ARCHIVE_SYNC_KEY')
  const key = req.headers.get('x-sync-key')
  return key === SYNC_KEY
}

export const bundleSyncHttpHandler = httpAction(async (ctx, req) => {
  if (!validateSyncKey(req)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const url = new URL(req.url)
  const action = url.pathname.split('/').pop()

  if (action === 'archives') {
    // List recent archives
    const archives = await ctx.runQuery(internal.db.snapshot.crawl.archives.list, {
      paginationOpts: { cursor: null, numItems: SYNC_RECORDS_LIMIT },
      order: 'desc',
    })

    return new Response(JSON.stringify(archives.page), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  if (action === 'bundle') {
    // Download specific archive bundle
    const crawlId = url.searchParams.get('crawl_id')

    if (!crawlId) {
      return new Response('Missing crawl_id parameter', { status: 400 })
    }

    const archive = await ctx.runQuery(internal.db.snapshot.crawl.archives.getByCrawlId, {
      crawl_id: crawlId,
    })

    if (!archive) {
      return new Response('Archive not found', { status: 404 })
    }

    const blob = await ctx.storage.get(archive.storage_id)
    if (!blob) {
      return new Response('Bundle not found', { status: 404 })
    }

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    })
  }

  return new Response('Not found', { status: 404 })
})
