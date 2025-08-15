import { v } from 'convex/values'

import { gunzipSync } from 'fflate'

import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import { internalAction, internalMutation } from '../_generated/server'
import { storeCrawlBundle, type CrawlArchiveBundle } from './crawl'

const textDecoder = new TextDecoder()

function parseJsonFromGzip(buffer: ArrayBuffer): unknown {
  const decompressed = gunzipSync(new Uint8Array(buffer))
  return JSON.parse(textDecoder.decode(decompressed))
}

function unwrapDataArray(raw: any): unknown[] {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const data = (raw as { data: unknown }).data
    return Array.isArray(data) ? data : [data]
  }
  return Array.isArray(raw) ? raw : [raw]
}

function unwrapDataSingle(raw: any): Record<string, unknown> {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const data = (raw as { data: Record<string, unknown> }).data
    return data ?? {}
  }
  return (raw ?? {}) as Record<string, unknown>
}

function buildModelKey(permaslug: string, variant: string | null | undefined): string {
  return `${permaslug}:${variant ?? ''}`
}

export const step1_crawlToBundle = internalAction({
  args: { crawlId: v.string() },
  handler: async (ctx, { crawlId }) => {
    // 1) Load all raw archive records for the crawl
    const archives = await ctx.runQuery(internal.db.snapshot.rawArchives.getByCrawlId, {
      crawlId,
    })

    if (!archives.length) {
      console.log(`[migrate:step1_crawlToBundle] no archives for crawl ${crawlId}`)
      return null
    }

    console.log(`[migrate:step1_crawlToBundle]`, { crawlId, archives: archives.length })

    // 2) Categorize by path prefix for minimal parsing and stable ordering
    const providerRows = [] as typeof archives
    const modelsRows = [] as typeof archives
    const endpointRows = [] as typeof archives
    const appRows = [] as typeof archives
    const uptimeRows = [] as typeof archives
    const authorRows = [] as typeof archives

    for (const row of archives) {
      const path = row.path
      if (path === '/api/frontend/all-providers') providerRows.push(row)
      else if (path === '/api/frontend/models') modelsRows.push(row)
      else if (path.startsWith('/api/frontend/stats/endpoint')) endpointRows.push(row)
      else if (path.startsWith('/api/frontend/stats/app')) appRows.push(row)
      else if (path.startsWith('/api/frontend/stats/uptime-hourly')) uptimeRows.push(row)
      else if (path.startsWith('/api/frontend/model-author')) authorRows.push(row)
    }

    // 3) Seed bundle with empty arrays
    const bundle: CrawlArchiveBundle = {
      crawl_id: crawlId,
      args: {
        providers: providerRows.length > 0,
        models: modelsRows.length > 0,
        endpoints: endpointRows.length > 0,
        apps: appRows.length > 0,
        uptimes: uptimeRows.length > 0,
        modelAuthors: authorRows.length > 0,
      },
      data: {
        providers: [],
        modelAuthors: [],
        models: [],
      },
    }

    // Helper index by model permaslug+variant
    const modelKeyToIndex = new Map<string, number>()
    const endpointIdToModelKey = new Map<string, string>()

    // 4) Load models
    if (modelsRows.length) {
      const blob = await ctx.storage.get(modelsRows[0].storage_id)
      if (blob) {
        const raw = parseJsonFromGzip(await blob.arrayBuffer()) as any
        const items = unwrapDataArray(raw) as Array<any>
        for (const item of items) {
          const modelMinimal = {
            slug: String(item.slug),
            permaslug: String(item.permaslug),
            author: String(item.author),
            endpoint: item.endpoint ? { variant: String(item.endpoint.variant) } : null,
          }
          const entry: CrawlArchiveBundle['data']['models'][number] = {
            model: modelMinimal,
            endpoints: [],
            uptimes: [],
            apps: [],
          }
          const index = bundle.data.models.push(entry) - 1
          const key = buildModelKey(modelMinimal.permaslug, modelMinimal.endpoint?.variant)
          modelKeyToIndex.set(key, index)
        }
      }
    }

    // 5) Load endpoints and map endpoint ids to model keys
    for (const row of endpointRows) {
      try {
        const url = new URL(row.path, 'https://dummy')
        const permaslug = url.searchParams.get('permaslug') ?? ''
        const variant = url.searchParams.get('variant') ?? ''
        const key = buildModelKey(permaslug, variant)

        const blob = await ctx.storage.get(row.storage_id)
        if (!blob) continue
        const raw = parseJsonFromGzip(await blob.arrayBuffer()) as any
        const endpoints = unwrapDataArray(raw) as Array<any>

        const idx = modelKeyToIndex.get(key)
        if (idx !== undefined) {
          bundle.data.models[idx].endpoints = endpoints as any
          for (const ep of endpoints) {
            if (ep && typeof ep.id === 'string') endpointIdToModelKey.set(ep.id, key)
          }
        }
      } catch (err) {
        console.error('[migrate:step1_crawlToBundle.endpoints]', {
          path: row.path,
          error: (err as Error).message,
        })
      }
    }

    // 6) Load apps (per model)
    for (const row of appRows) {
      try {
        const url = new URL(row.path, 'https://dummy')
        const permaslug = url.searchParams.get('permaslug') ?? ''
        const variant = url.searchParams.get('variant') ?? ''
        const key = buildModelKey(permaslug, variant)

        const blob = await ctx.storage.get(row.storage_id)
        if (!blob) continue
        const raw = parseJsonFromGzip(await blob.arrayBuffer()) as any
        const apps = unwrapDataArray(raw)

        const idx = modelKeyToIndex.get(key)
        if (idx !== undefined) bundle.data.models[idx].apps = apps as any
      } catch (err) {
        console.error('[migrate:step1_crawlToBundle.apps]', {
          path: row.path,
          error: (err as Error).message,
        })
      }
    }

    // 7) Load uptimes and attach to owning model via endpoint id mapping
    for (const row of uptimeRows) {
      try {
        const url = new URL(row.path, 'https://dummy')
        const id = url.searchParams.get('id') ?? ''
        const key = endpointIdToModelKey.get(id)
        if (!key) continue

        const blob = await ctx.storage.get(row.storage_id)
        if (!blob) continue
        const raw = parseJsonFromGzip(await blob.arrayBuffer()) as any
        const uptime = unwrapDataSingle(raw)

        const idx = modelKeyToIndex.get(key)
        if (idx !== undefined) bundle.data.models[idx].uptimes.push([id, uptime as any])
      } catch (err) {
        console.error('[migrate:step1_crawlToBundle.uptimes]', {
          path: row.path,
          error: (err as Error).message,
        })
      }
    }

    // 8) Load providers
    for (const row of providerRows) {
      try {
        const blob = await ctx.storage.get(row.storage_id)
        if (!blob) continue
        const raw = parseJsonFromGzip(await blob.arrayBuffer()) as any
        const providers = unwrapDataArray(raw)
        bundle.data.providers = providers as any
      } catch (err) {
        console.error('[migrate:step1_crawlToBundle.providers]', {
          path: row.path,
          error: (err as Error).message,
        })
      }
    }

    // 9) Load model authors
    for (const row of authorRows) {
      try {
        const blob = await ctx.storage.get(row.storage_id)
        if (!blob) continue
        const raw = parseJsonFromGzip(await blob.arrayBuffer()) as any
        const author = unwrapDataSingle(raw)
        bundle.data.modelAuthors.push(author as any)
      } catch (err) {
        console.error('[migrate:step1_crawlToBundle.modelAuthors]', {
          path: row.path,
          error: (err as Error).message,
        })
      }
    }

    // 10) Write new bundled archive via shared save function
    await storeCrawlBundle(ctx, bundle)

    console.log(`[migrate:step1_crawlToBundle] complete`, { crawlId })
  },
})

export const deleteRawArchivesByIds = internalMutation({
  args: { ids: v.array(v.id('snapshot_raw_archives')) },
  handler: async (ctx, { ids }) => {
    for (const id of ids) {
      try {
        await ctx.db.delete(id)
      } catch (err) {
        console.error('[migrate:step2_deleteLegacyArchives.delete.record]', {
          id,
          error: (err as Error).message,
        })
      }
    }
  },
})

export const step2_deleteLegacyArchives = internalAction({
  args: { crawlId: v.string() },
  handler: async (ctx, { crawlId }) => {
    const archives = await ctx.runQuery(internal.db.snapshot.rawArchives.getByCrawlId, {
      crawlId,
    })

    console.log(`[migrate:step2_deleteLegacyArchives]`, { crawlId, archives: archives.length })

    const recordIds: Array<Id<'snapshot_raw_archives'>> = []
    for (const row of archives) {
      try {
        await ctx.storage.delete(row.storage_id as Id<'_storage'>)
      } catch (err) {
        console.error('[migrate:step2_deleteLegacyArchives.delete.storage]', {
          storage_id: row.storage_id,
          error: (err as Error).message,
        })
      }
      recordIds.push(row._id as Id<'snapshot_raw_archives'>)
    }

    if (recordIds.length) {
      await ctx.runMutation(internal.snapshots.migrateBundle.deleteRawArchivesByIds, {
        ids: recordIds,
      })
    }

    console.log(`[migrate:step2_deleteLegacyArchives] complete`, {
      crawlId,
      records: recordIds.length,
    })
  },
})

const runDelaySec = 10
export const run = internalAction({
  args: { crawl_id: v.string() },
  handler: async (ctx, args) => {
    const crawl_id = args.crawl_id

    if (!crawl_id) {
      console.log('[migrate:run] no crawl_id provided')
      return
    }

    // ok to call runAction during this one-off migration
    await ctx.runAction(internal.snapshots.migrateBundle.step1_crawlToBundle, { crawlId: crawl_id })
    // await ctx.runAction(internal.snapshots.migrateBundle.step2_deleteLegacyArchives, {
    //   crawlId: crawl_id,
    // })

    // Get the next crawl ID to process
    const nextCrawlId = await ctx.runQuery(internal.db.snapshot.rawArchives.getNextCrawlId, {
      afterCrawlId: crawl_id,
    })

    if (nextCrawlId) {
      const schId = await ctx.scheduler.runAfter(
        runDelaySec * 1000,
        internal.snapshots.migrateBundle.run,
        {
          crawl_id: nextCrawlId,
        },
      )
      console.log(`[migrate:run] scheduled next run in ${runDelaySec}s`, {
        schId,
        nextCrawlId,
        completedCrawlId: crawl_id,
      })
    } else {
      console.log('[migrate:run] completed all crawls', { lastCrawlId: crawl_id })
    }
  },
})
