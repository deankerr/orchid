import { v } from 'convex/values'
import * as R from 'remeda'

import { internal } from './_generated/api'
import { internalAction, internalMutation } from './_generated/server'
import * as DB from './db'
import { getArchiveBundle } from './snapshots/bundle'
import type { CrawlArchiveBundle } from './snapshots/crawl'

export const sizes = internalMutation({
  returns: v.null(),
  handler: async (ctx) => {
    const m = await ctx.db.query('or_models').collect()
    const ms = new TextEncoder().encode(JSON.stringify(m)).length

    const e = await ctx.db.query('or_endpoints').collect()
    const es = new TextEncoder().encode(JSON.stringify(e)).length

    console.log({
      models: m.length,
      modelsSizeKb: ms / 1024,
      modelsAvgSizeKb: ms / m.length / 1024,
      endpoints: e.length,
      endpointsSizeKb: es / 1024,
      endpointsAvgSizeKb: es / e.length / 1024,
    })
  },
})

export const clearORTables = internalMutation({
  args: {
    models: v.boolean(),
    endpoints: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.models) {
      const models = await ctx.db.query('or_models').collect()
      for (const model of models) {
        await ctx.db.delete(model._id)
      }
      console.log(`[clearOrTables] deleted ${models.length} models`)
    }

    if (args.endpoints) {
      const endpoints = await ctx.db.query('or_endpoints').collect()
      for (const endpoint of endpoints) {
        await ctx.db.delete(endpoint._id)
      }
      console.log(`[clearOrTables] deleted ${endpoints.length} endpoints`)
    }
  },
})

export const takeSnapshotNow = internalAction({
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runAction(internal.snapshots.crawl.run, {
      apps: true,
      uptimes: true,
      modelAuthors: true,
      processChanges: true,
    })

    await ctx.runAction(internal.snapshots.materialize.materialize.run, {})
  },
})

export const stats = internalMutation({
  handler: async (ctx) => {
    const models = await DB.OrModels.list(ctx)
    const endpoints = await DB.OrEndpoints.list(ctx)
    const providers = await DB.OrProviders.list(ctx)

    console.log(
      'models: slug = permaslug',
      R.countBy(models, (e) => String(e.slug === e.permaslug)),
    )

    console.log(
      'endpoints per variant',
      R.countBy(endpoints, (e) => e.model_variant),
    )

    for (const endp of endpoints) {
      const prov = providers.find((p) => p.slug === endp.provider_slug.split('/')[0])
      if (!prov) {
        console.log('no provider', endp.name)
        continue
      }

      if (
        prov.capabilities.completions !== endp.capabilities.completions ||
        prov.capabilities.chat_completions !== endp.capabilities.chat_completions
      ) {
        console.log(endp.name)
      }
    }
  },
})

/**
 * Utility function to analyze all endpoints in a bundle using a custom map function.
 *
 * @param bundle - The crawl archive bundle containing model and endpoint data
 * @param mapFn - Function to process each endpoint, receives (endpoint, modelEntry) and returns T
 * @returns Array of results from applying mapFn to each endpoint
 *
 * @example
 * // Count endpoints by provider
 * const providerCounts = analyzeEndpoints(bundle, (endpoint) => endpoint.provider_slug)
 *   .reduce((acc, provider) => {
 *     acc[provider] = (acc[provider] || 0) + 1
 *     return acc
 *   }, {} as Record<string, number>)
 *
 * @example
 * // Get all endpoints with pricing data
 * const endpointsWithPricing = analyzeEndpoints(bundle,
 *   (endpoint) => endpoint.pricing ? endpoint : null
 * ).filter(Boolean)
 */
export function analyzeEndpoints<T>(
  bundle: CrawlArchiveBundle,
  mapFn: (endpoint: any, modelEntry: CrawlArchiveBundle['data']['models'][number]) => T,
): T[] {
  const results: T[] = []

  for (const modelEntry of bundle.data.models) {
    for (const endpoint of modelEntry.endpoints) {
      results.push(mapFn(endpoint, modelEntry))
    }
  }

  return results
}

export const archivePricingAnalysis = internalAction({
  handler: async (ctx, _args) => {
    // Get the latest crawl_id
    const crawl_id = await ctx.runQuery(internal.db.snapshot.crawlArchives.getLatestCrawlId)

    if (!crawl_id) {
      console.log('[archivePricingAnalysis] no crawl_id found')
      return null
    }

    console.log('[archivePricingAnalysis] analyzing pricing for', { crawl_id })

    const bundle = await getArchiveBundle(ctx, crawl_id)

    if (!bundle) {
      console.log('[archivePricingAnalysis] no bundle found', { crawl_id })
      return null
    }

    // Track pricing keys and their associated endpoint names using the utility function
    const pricingKeyData: Record<string, string[]> = {}

    const endpointPricingResults = analyzeEndpoints(bundle, (endpoint) => {
      if (endpoint.pricing) {
        const results: Array<{ key: string; endpointName: string }> = []
        for (const [key, value] of Object.entries(endpoint.pricing)) {
          // Skip if value is "0" or 0
          if (value === '0' || value === 0) {
            continue
          }
          results.push({ key, endpointName: String(endpoint.name) })
        }
        return results
      }
      return []
    })

    // Flatten and collect pricing data
    const allPricingEntries = endpointPricingResults.flat()
    for (const { key, endpointName } of allPricingEntries) {
      if (!pricingKeyData[key]) {
        pricingKeyData[key] = []
      }
      pricingKeyData[key].push(endpointName)
    }

    const totalEndpointsProcessed = analyzeEndpoints(bundle, () => 1).length

    // Build results with counts and names (if <= 10)
    const results: Record<string, { count: number; names?: string[] }> = {}

    for (const [key, names] of Object.entries(pricingKeyData)) {
      results[key] = {
        count: names.length,
        ...(names.length <= 10 ? { names } : {}),
      }
    }

    // Sort by count descending
    const sortedResults = Object.entries(results)
      .sort(([, a], [, b]) => b.count - a.count)
      .reduce(
        (acc, [key, data]) => {
          acc[key] = data
          return acc
        },
        {} as Record<string, { count: number; names?: string[] }>,
      )

    console.log('[archivePricingAnalysis] processed', totalEndpointsProcessed, 'endpoints')
    console.log('[archivePricingAnalysis] pricing key analysis:', sortedResults)

    const statuses = analyzeEndpoints(bundle, (endp) => {
      const status = endp?.status ?? 0
      if (status !== 0 && status !== -3) {
        return { name: endp.name, status }
      }
      return null
    }).filter((r) => r !== null)
    console.log('statuses', statuses, statuses.length)

    return null
  },
})
