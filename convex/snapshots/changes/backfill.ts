import { v } from 'convex/values'

import { internal } from '../../_generated/api'
import { internalAction, type ActionCtx } from '../../_generated/server'
import { getArchiveBundle } from '../bundle'
import type { CrawlArchiveBundle } from '../crawl'
import { processEntityChanges } from './entity'

async function processChangesForBundlePair(
  ctx: ActionCtx,
  args: { currentBundle: CrawlArchiveBundle; previousBundle: CrawlArchiveBundle },
) {
  await Promise.all([
    processEntityChanges(ctx, 'models', args),
    processEntityChanges(ctx, 'endpoints', args),
    processEntityChanges(ctx, 'providers', args),
  ])
}

export const processAllCrawlArchives = internalAction({
  args: {
    batchSize: v.optional(v.number()),
    startFromCrawlId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100
    console.log('[processAllCrawlArchives] starting batch', {
      batchSize,
      startFromCrawlId: args.startFromCrawlId,
    })

    const crawlIds = await ctx.runQuery(internal.db.snapshot.crawlArchives.getCrawlIdsFromPoint, {
      startFromCrawlId: args.startFromCrawlId,
      limit: batchSize,
    })

    if (crawlIds.length < 2) {
      console.log('[processAllCrawlArchives] not enough crawls to process', {
        count: crawlIds.length,
      })
      return null
    }

    console.log('[processAllCrawlArchives] processing crawls', {
      count: crawlIds.length,
      first: crawlIds[0],
      last: crawlIds[crawlIds.length - 1],
    })

    let previousBundle = await getArchiveBundle(ctx, crawlIds[0])
    if (!previousBundle) {
      throw new Error(`Failed to load first bundle: ${crawlIds[0]}`)
    }

    for (let i = 1; i < crawlIds.length; i++) {
      const currentCrawlId = crawlIds[i]
      console.log('[processAllCrawlArchives] processing pair', {
        from: previousBundle.crawl_id,
        to: currentCrawlId,
        progress: `${i}/${crawlIds.length - 1}`,
      })

      const currentBundle = await getArchiveBundle(ctx, currentCrawlId)
      if (!currentBundle) {
        throw new Error(`Failed to load bundle: ${currentCrawlId}`)
      }

      await processChangesForBundlePair(ctx, { currentBundle, previousBundle })
      previousBundle = currentBundle
    }

    const processedPairs = crawlIds.length - 1
    const nextStartPoint = crawlIds.length === batchSize ? crawlIds[crawlIds.length - 1] : null

    console.log('[processAllCrawlArchives] batch complete', {
      processedPairs,
      nextStartPoint,
      hasMore: nextStartPoint !== null,
    })

    return null
  },
})
