import { v } from 'convex/values'

import { internal } from '../../_generated/api'
import { internalAction } from '../../_generated/server'
import { getArchiveBundle } from '../bundle'
import type { CrawlArchiveBundle } from '../crawl'
import { processBundleChanges } from './process'

export const run = internalAction({
  args: {
    fromCrawlId: v.optional(v.string()),
    cursor: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log('[changes2:backfill] starting', {
      fromCrawlId: args.fromCrawlId,
      cursor: args.cursor,
    })

    let cursor = args.cursor ?? null
    let previousBundle: CrawlArchiveBundle | null = null

    while (true) {
      const results = await ctx.runQuery(internal.db.snapshot.crawlArchives.list, {
        paginationOpts: {
          numItems: 1,
          cursor,
        },
        fromCrawlId: args.fromCrawlId,
      })

      const currentArchive = results.page[0]
      if (!currentArchive) {
        console.log('[changes2:backfill] no more archives to process')
        break
      }

      const currentBundle = await getArchiveBundle(ctx, currentArchive.crawl_id)
      if (!currentBundle) {
        throw new Error(`Failed to load current bundle: ${currentArchive.crawl_id}`)
      }

      if (previousBundle) {
        console.log('[changes2:backfill] processing pair', {
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
          console.log(`[changes2:backfill] inserted ${changes.length} changes`)
        }
      }

      previousBundle = currentBundle
      cursor = results.continueCursor
    }

    console.log('[changes2:backfill] all archives complete')
  },
})
