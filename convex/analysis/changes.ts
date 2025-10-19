import { getPage } from 'convex-helpers/server/pagination'

import { internalMutation } from '../_generated/server'
import schema from '../schema'

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log('[changes:run] Starting analysis...')

    const stats = {
      total: 0,
      byEntity: {} as Record<string, number>,
      byChangeKind: {} as Record<string, number>,
      byEntityAndChangeKind: {} as Record<string, number>,
      byPath: {} as Record<string, number>,
      byProvider: {} as Record<string, number>,
      byCrawl: {} as Record<string, number>,
      byDay: {} as Record<string, number>,
    }

    // * Use getPage to paginate through all changes (supports multiple pages per function)
    let startIndexKey: Array<any> | undefined = undefined
    let hasMore = true
    const batchSize = 500

    while (hasMore) {
      const result = await getPage(ctx, {
        table: 'or_views_changes',
        index: 'by_crawl_id',
        schema,
        startIndexKey,
        targetMaxRows: batchSize,
        order: 'desc',
      })

      const page = result.page
      const indexKeys: Array<any> = result.indexKeys
      hasMore = result.hasMore

      for (const change of page) {
        stats.total++

        // Entity type distribution
        stats.byEntity[change.entity_type] = (stats.byEntity[change.entity_type] || 0) + 1

        // Change kind distribution
        stats.byChangeKind[change.change_kind] = (stats.byChangeKind[change.change_kind] || 0) + 1

        // Entity + Change kind distribution (e.g., "endpoint update")
        const entityChangeKey = `${change.entity_type} ${change.change_kind}`
        stats.byEntityAndChangeKind[entityChangeKey] =
          (stats.byEntityAndChangeKind[entityChangeKey] || 0) + 1

        // Path distribution (category-level changes)
        if (change.path_level_1) {
          stats.byPath[change.path_level_1] = (stats.byPath[change.path_level_1] || 0) + 1
        }

        // Provider activity
        if (change.provider_slug) {
          stats.byProvider[change.provider_slug] = (stats.byProvider[change.provider_slug] || 0) + 1
        }

        // Changes per crawl_id
        stats.byCrawl[change.crawl_id] = (stats.byCrawl[change.crawl_id] || 0) + 1

        // Changes per day (extract date from crawl_id timestamp)
        const timestamp = Number(change.crawl_id)
        if (!Number.isNaN(timestamp)) {
          const date = new Date(timestamp)
          const day = date.toISOString().split('T')[0] // YYYY-MM-DD
          stats.byDay[day] = (stats.byDay[day] || 0) + 1
        }
      }

      if (hasMore && indexKeys.length > 0) {
        startIndexKey = indexKeys[indexKeys.length - 1]
      }
    }

    // * Calculate derived statistics
    const crawlIds = Object.keys(stats.byCrawl)
    const days = Object.keys(stats.byDay).sort()

    const topPaths = Object.entries(stats.byPath)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([path, count]) => [path, count, ((count / stats.total) * 100).toFixed(1) + '%'])

    const topProviders = Object.entries(stats.byProvider)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([provider, count]) => [provider, count, ((count / stats.total) * 100).toFixed(1) + '%'])

    const entityChangeDistribution = Object.entries(stats.byEntityAndChangeKind)
      .sort((a, b) => b[1] - a[1])
      .map(([entityChangeKey, count]) => [
        entityChangeKey,
        count,
        ((count / stats.total) * 100).toFixed(1) + '%',
      ])

    // * Calculate distinct crawl_ids per day
    const crawlsByDay = {} as Record<string, Set<string>>
    for (const [crawl_id, _count] of Object.entries(stats.byCrawl)) {
      const timestamp = Number(crawl_id)
      if (!Number.isNaN(timestamp)) {
        const date = new Date(timestamp)
        const day = date.toISOString().split('T')[0] // YYYY-MM-DD
        if (!crawlsByDay[day]) {
          crawlsByDay[day] = new Set()
        }
        crawlsByDay[day].add(crawl_id)
      }
    }

    const crawlStats = Object.values(stats.byCrawl)

    const dailyStats = Object.values(stats.byDay)

    const result = {
      total: stats.total,
      crawlCount: crawlIds.length,
      dayCount: days.length,

      entityDistribution: Object.fromEntries(
        Object.entries(stats.byEntity).map(([entity, count]) => [
          entity,
          [count, ((count / stats.total) * 100).toFixed(1) + '%'] as [number, string],
        ]),
      ),
      changeKindDistribution: Object.fromEntries(
        Object.entries(stats.byChangeKind).map(([kind, count]) => [
          kind,
          [count, ((count / stats.total) * 100).toFixed(1) + '%'] as [number, string],
        ]),
      ),

      topPaths: topPaths,
      topProviders: topProviders,
      entityChangeDistribution: entityChangeDistribution,

      changesPerCrawl: {
        min: Math.min(...crawlStats),
        max: Math.max(...crawlStats),
        avg: crawlStats.reduce((a, b) => a + b, 0) / crawlStats.length,
        median: crawlStats.sort((a, b) => a - b)[Math.floor(crawlStats.length / 2)],
      },

      changesPerDay: {
        min: Math.min(...dailyStats),
        max: Math.max(...dailyStats),
        avg: dailyStats.reduce((a, b) => a + b, 0) / dailyStats.length,
        median: dailyStats.sort((a, b) => a - b)[Math.floor(dailyStats.length / 2)],
      },

      dailyTable: Object.entries(stats.byDay)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([day, changes]) => ({
          day,
          changes,
          crawls: crawlsByDay[day]?.size || 0,
        })),

      dateRange: {
        earliest: days[0],
        latest: days[days.length - 1],
      },
    }
    return result
  },
})
