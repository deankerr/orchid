import { getPage } from 'convex-helpers/server/pagination'
import { paginationOptsValidator } from 'convex/server'

import type { Doc } from './_generated/dataModel'
import { query } from './_generated/server'
import schema from './schema'

type OrViewsChangeDoc = Doc<'or_views_changes'>

export type EndpointChange = Extract<OrViewsChangeDoc, { entity_type: 'endpoint' }>

export type FeedItem = {
  crawl_id: string
  provider_slug: string
  provider_tag_slug: string
  endpoint_uuid: string
  model_slugs: string[]
  total_count: number
  preview_changes: EndpointChange[]
  all_changes: EndpointChange[]
  has_more: boolean
}

export const changes = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // * Use getPage to paginate through changes ordered by crawl_id descending
    const result = await getPage(ctx, {
      table: 'or_views_changes',
      index: 'by_crawl_id',
      schema,
      startIndexKey: args.paginationOpts.cursor
        ? JSON.parse(args.paginationOpts.cursor)
        : undefined,
      targetMaxRows: args.paginationOpts.numItems,
      order: 'desc',
    })

    // * Filter and group by crawl_id, then by provider_slug, then by provider_tag_slug
    const crawlGroups = new Map<string, Map<string, Map<string, EndpointChange[]>>>()

    for (const change of result.page) {
      // Only include endpoint changes (94.5% of data)
      if (change.entity_type !== 'endpoint') continue

      // Type is now narrowed to EndpointChange
      if (!crawlGroups.has(change.crawl_id)) {
        crawlGroups.set(change.crawl_id, new Map())
      }

      const crawlGroup = crawlGroups.get(change.crawl_id)!

      if (!crawlGroup.has(change.provider_slug)) {
        crawlGroup.set(change.provider_slug, new Map())
      }

      const providerGroup = crawlGroup.get(change.provider_slug)!

      if (!providerGroup.has(change.provider_tag_slug)) {
        providerGroup.set(change.provider_tag_slug, [])
      }

      providerGroup.get(change.provider_tag_slug)!.push(change)
    }

    // * Transform to feed structure with nested provider grouping
    const feedItems = []
    for (const [crawl_id, providerSlugs] of crawlGroups) {
      for (const [provider_slug, tagSlugs] of providerSlugs) {
        // Sort tag_slugs alphabetically within each provider_slug group
        const sortedTagSlugs = Array.from(tagSlugs.entries()).sort((a, b) =>
          a[0].localeCompare(b[0]),
        )

        for (const [_provider_tag_slug, changes] of sortedTagSlugs) {
          feedItems.push({
            crawl_id,
            provider_slug,
            provider_tag_slug: changes[0].provider_tag_slug,
            endpoint_uuid: changes[0].endpoint_uuid,
            model_slugs: Array.from(new Set(changes.map((c) => c.model_slug))),
            total_count: changes.length,
            preview_changes: changes.slice(0, 5),
            all_changes: changes,
            has_more: changes.length > 5,
          })
        }
      }
    }

    return {
      page: feedItems,
      continueCursor: result.hasMore
        ? JSON.stringify(result.indexKeys[result.indexKeys.length - 1])
        : '',
      isDone: !result.hasMore,
    }
  },
})
