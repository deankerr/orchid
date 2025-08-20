import { v } from 'convex/values'

import { internal } from '../../_generated/api'
import { internalAction } from '../../_generated/server'
import { getArchiveBundle } from '../bundle'
import type { CrawlArchiveBundle } from '../crawl'
import { processEntityChanges } from './process'

export const run = internalAction({
  args: {
    fromCrawlId: v.optional(v.string()),
    cursor: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log('[changes:backfill] starting', {
      fromCrawlId: args.fromCrawlId,
      cursor: args.cursor,
    })

    let cursor = args.cursor ?? null
    let previousBundle: CrawlArchiveBundle | null = null

    while (true) {
      // Get a single archive record
      const results = await ctx.runQuery(internal.db.snapshot.crawlArchives.list, {
        paginationOpts: {
          numItems: 1,
          cursor,
        },
        fromCrawlId: args.fromCrawlId,
      })

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
        // Process changes between previous and current
        console.log('[changes:backfill] processing pair', {
          from: previousBundle.crawl_id,
          to: currentBundle.crawl_id,
        })

        // * process entities
        await processEntityChanges(ctx, { entityType: 'models', currentBundle, previousBundle })
        await processEntityChanges(ctx, { entityType: 'endpoints', currentBundle, previousBundle })
        await processEntityChanges(ctx, { entityType: 'providers', currentBundle, previousBundle })
      }

      // Move current to previous for next iteration
      previousBundle = currentBundle
      cursor = results.continueCursor
    }

    console.log('[changes:backfill] all archives complete')
  },
})
