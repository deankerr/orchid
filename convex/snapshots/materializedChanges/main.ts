import { v } from 'convex/values'

import { internal } from '../../_generated/api'
import { internalAction, type ActionCtx } from '../../_generated/server'
import { paginateAndProcess } from '../../shared'
import { materializeModelEndpoints } from '../materialize/main'
import { getArchiveBundle } from '../shared/bundle'
import { computeMaterializedChanges } from './process'

export const run = internalAction({
  args: {
    fromCrawlId: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let previous: LoadedMaterializedSnapshot | null = null
    let processedPairs = 0

    const fromCrawlId =
      args.fromCrawlId ?? (await ctx.runQuery(internal.db.or.views.changes.getLatestCrawlId))

    if (!fromCrawlId) throw new Error('no crawl id found')

    await paginateAndProcess(ctx, {
      queryFnArgs: { fromCrawlId },
      queryFn: async (innerCtx, queryArgs) =>
        await innerCtx.runQuery(internal.db.snapshot.crawl.archives.list, queryArgs),
      processFn: async (archives) => {
        for (const archive of archives) {
          const current = await loadMaterializedSnapshot(ctx, archive.crawl_id)

          if (!previous) {
            previous = current
            continue
          }

          const changes = computeMaterializedChanges({
            previous: previous.materialized,
            current: current.materialized,
            previous_crawl_id: previous.crawl_id,
            crawl_id: current.crawl_id,
          })

          const counters = await ctx.runMutation(internal.db.or.views.changes.replacePairChanges, {
            previous_crawl_id: previous.crawl_id,
            crawl_id: current.crawl_id,
            changes,
          })

          console.log('[materializedChanges] pair processed', {
            previous_crawl_id: previous.crawl_id,
            crawl_id: current.crawl_id,
            count: changes.length,
            counters,
          })

          previous = current
          processedPairs += 1
        }
      },
      batchSize: args.batchSize ?? 25,
    })

    console.log('[materializedChanges] complete', { processedPairs })
  },
})

type LoadedMaterializedSnapshot = {
  crawl_id: string
  materialized: ReturnType<typeof materializeModelEndpoints>
}

async function loadMaterializedSnapshot(
  ctx: ActionCtx,
  crawl_id: string,
): Promise<LoadedMaterializedSnapshot> {
  const bundle = await getArchiveBundle(ctx, crawl_id)
  if (!bundle) {
    throw new Error(`[materializedChanges] missing bundle for crawl_id: ${crawl_id}`)
  }

  const materialized = materializeModelEndpoints(bundle)
  if (materialized.issues.length) {
    throw new Error(`[materializedChanges] validation issues for crawl ${crawl_id}`)
  }

  return {
    crawl_id,
    materialized,
  }
}
