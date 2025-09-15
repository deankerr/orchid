import type { PaginationResult } from 'convex/server'

import { internal } from '../../_generated/api'
import type { Doc } from '../../_generated/dataModel'
import { internalAction } from '../../_generated/server'
import { getArchiveBundle } from '../bundle'
import type { CrawlArchiveBundle } from '../crawl'
import { processBundleChanges } from './process'

export const run = internalAction({
  handler: async (ctx) => {
    const latestChange = await ctx.runQuery(internal.db.or.changes.list, {
      paginationOpts: {
        numItems: 1,
        cursor: null,
      },
    })

    const fromCrawlId = latestChange.page[0]?.crawl_id

    console.log('[changes:backfill] starting', {
      fromCrawlId,
    })

    let cursor: string | null = null
    let previousBundle: CrawlArchiveBundle | null = null

    while (true) {
      const results: PaginationResult<Doc<'snapshot_crawl_archives'>> = await ctx.runQuery(
        internal.db.snapshot.crawl.archives.list,
        {
          paginationOpts: {
            numItems: 1,
            cursor,
          },
          fromCrawlId,
        },
      )

      const currentArchive = results.page[0]
      if (!currentArchive) {
        console.log('[changes:backfill] no more archives to process')
        break
      }

      const currentBundle = await getArchiveBundle(ctx, currentArchive.crawl_id)
      if (!currentBundle) {
        throw new Error(`Failed to load current bundle: ${currentArchive.crawl_id}`)
      }

      if (previousBundle) {
        console.log('[changes:backfill] processing pair', {
          from: previousBundle.crawl_id,
          to: currentBundle.crawl_id,
        })

        const changes = processBundleChanges({
          fromBundle: previousBundle,
          toBundle: currentBundle,
        })

        if (changes.length > 0) {
          await ctx.runMutation(internal.db.or.changes.insert, {
            changes,
          })
          console.log(`[changes:backfill] inserted ${changes.length} changes`)
        }
      }

      previousBundle = currentBundle
      cursor = results.continueCursor
    }

    console.log('[changes:backfill] all archives complete')
  },
})
