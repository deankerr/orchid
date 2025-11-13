import { stream } from 'convex-helpers/server/stream'
import { paginationOptsValidator } from 'convex/server'

import type { Doc } from './_generated/dataModel'
import { query } from './_generated/server'
import schema from './schema'

export type EndpointChangeDoc = Extract<Doc<'or_views_changes'>, { entity_type: 'endpoint' }>

const GOAL_COUNT = 50
const MAX_CYCLES = 50

export const changesByCrawlId = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { paginationOpts }) => {
    const batchStream = stream(ctx.db, schema)
      .query('or_views_changes')
      .withIndex('by_entity_type__crawl_id', (q) => {
        if (paginationOpts.cursor) {
          return q.eq('entity_type', 'endpoint').lt('crawl_id', paginationOpts.cursor)
        }
        return q.eq('entity_type', 'endpoint')
      })
      .order('desc')
      .distinct(['crawl_id'])
      .map(async (p) => {
        const batch = await ctx.db
          .query('or_views_changes')
          .withIndex('by_entity_type__crawl_id', (q) =>
            q.eq('entity_type', 'endpoint').eq('crawl_id', p.crawl_id),
          )
          .order('desc')
          .collect()

        return batch
          .filter((b) => b.entity_type === 'endpoint') // redundant but sets type
          .filter((b) => b.path !== 'provider.icon_url')
      })

    const batchResults: { crawl_id: string; data: EndpointChangeDoc[] }[] = []
    let continueCursor = ''
    let cycles = 0
    let totalResults = 0

    for await (const batch of batchStream) {
      cycles++

      const crawl_id = batch?.[0].crawl_id
      if (crawl_id) {
        batch.sort((a, b) => {
          const providerCompare = a.provider_tag_slug.localeCompare(b.provider_tag_slug)
          if (providerCompare !== 0) return providerCompare
          const modelCompare = a.model_slug.localeCompare(b.model_slug)
          if (modelCompare !== 0) return modelCompare
          if (a.path && b.path) return a.path.localeCompare(b.path)
          return 0
        })
        batchResults.push({ crawl_id, data: batch })
        totalResults += batch.length
      }
      continueCursor = crawl_id ?? ''

      if (cycles >= MAX_CYCLES) break
      if (totalResults >= GOAL_COUNT) break
    }

    return {
      page: batchResults,
      continueCursor,
      isDone: continueCursor === '',
      pageStatus: null,
    }
  },
})
