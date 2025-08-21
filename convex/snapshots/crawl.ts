import { v } from 'convex/values'
import z4 from 'zod/v4'

import { gzipSync } from 'fflate'
import prettyBytes from 'pretty-bytes'
import { up } from 'up-fetch'

import { internal } from '../_generated/api'
import { internalAction, type ActionCtx } from '../_generated/server'
import { getErrorMessage } from '../shared'

export const orFetch = up(fetch, () => ({
  baseUrl: 'https://openrouter.ai',
  retry: {
    attempts: 2,
    delay: (ctx) => ctx.attempt ** 2 * 1000,
  },
}))

// * validate only the minimum we require for the crawl, extracting the contents of the `data` prop
const ModelsDataRecordArray = z4
  .object({
    data: z4.array(
      z4.looseObject({
        slug: z4.string(),
        permaslug: z4.string(),
        author: z4.string(),
        endpoint: z4.looseObject({ variant: z4.string() }).nullable(),
      }),
    ),
  })
  .transform((v) => v.data)

const EndpointsDataRecordArray = z4
  .object({
    data: z4.array(
      z4.looseObject({
        id: z4.string(),
      }),
    ),
  })
  .transform((v) => v.data)

const DataRecord = z4
  .object({ data: z4.record(z4.string(), z4.unknown()) })
  .transform((value) => value.data)

const DataRecordArray = z4
  .object({ data: z4.record(z4.string(), z4.unknown()).array() })
  .transform((value) => value.data)

// ----------------------------------------------
// Single exported type and schema for the archived crawl bundle
// ----------------------------------------------

type ModelsArray = z4.infer<typeof ModelsDataRecordArray>
type EndpointsArray = z4.infer<typeof EndpointsDataRecordArray>
type DataRecordItem = z4.infer<typeof DataRecord>
type DataRecordItemArray = z4.infer<typeof DataRecordArray>

export type CrawlArchiveBundle = {
  crawl_id: string
  args: Record<string, boolean>
  data: {
    models: Array<{
      model: ModelsArray[number]
      endpoints: EndpointsArray
      uptimes: Array<[string, DataRecordItem]>
      apps: DataRecordItemArray
    }>
    providers: DataRecordItemArray
    modelAuthors: Array<DataRecordItem>
  }
}

const ModelMinimalSchema = z4.looseObject({
  slug: z4.string(),
  permaslug: z4.string(),
  author: z4.string(),
  endpoint: z4.looseObject({ variant: z4.string() }).nullable(),
})

const EndpointMinimalSchema = z4.looseObject({ id: z4.string() })
const DataRecordSchema = z4.record(z4.string(), z4.unknown())

const CrawlArchiveBundleSchema = z4.strictObject({
  crawl_id: z4.string(),
  args: z4.record(z4.string(), z4.boolean()),
  data: z4.strictObject({
    models: z4.array(
      z4.strictObject({
        model: ModelMinimalSchema,
        endpoints: z4.array(EndpointMinimalSchema),
        uptimes: z4.array(z4.tuple([z4.string(), DataRecordSchema])),
        apps: z4.array(DataRecordSchema),
      }),
    ),
    providers: z4.array(DataRecordSchema),
    modelAuthors: z4.array(DataRecordSchema),
  }),
})

export const run = internalAction({
  args: {
    apps: v.boolean(),
    uptimes: v.boolean(),
    modelAuthors: v.boolean(),
    processChanges: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const crawl_id = Date.now().toString()
    console.log(`[crawl]`, { crawl_id, ...args })

    const bundle: CrawlArchiveBundle = {
      crawl_id,
      args,
      data: {
        providers: [],
        modelAuthors: [],
        models: [],
      },
    }

    // * providers
    try {
      bundle.data.providers = await orFetch('/api/frontend/all-providers', {
        schema: DataRecordArray,
      })
    } catch (err) {
      console.error('[crawl:providers]', { error: getErrorMessage(err) })
    }

    // * models
    const models = await orFetch('/api/frontend/models', { schema: ModelsDataRecordArray })

    for (const model of models) {
      const modelData = await fetchModelData(args, model)
      bundle.data.models.push(modelData)
    }

    // * modelAuthors
    if (args.modelAuthors) {
      const modelAuthors: Array<DataRecordItem> = []
      const authorSlugs = new Set(models.map((model) => model.author))

      for (const authorSlug of authorSlugs) {
        try {
          const modelAuthor = await orFetch('/api/frontend/model-author', {
            params: { authorSlug, shouldIncludeStats: true, shouldIncludeVariants: false },
            schema: DataRecord,
          })
          modelAuthors.push(modelAuthor)
        } catch (err) {
          console.error('[crawl:modelAuthors]', { authorSlug, error: getErrorMessage(err) })
        }
      }

      bundle.data.modelAuthors = modelAuthors
    }

    try {
      await storeCrawlBundle(ctx, bundle)
      console.log(`[crawl] complete`, { crawl_id, args })

      if (args.processChanges) {
        await ctx.scheduler.runAfter(0, internal.snapshots.changes.postCrawl.runPostCrawl, {
          crawl_id,
        })
      }
    } catch (err) {
      console.error('[crawl] failed', { crawl_id, args, error: getErrorMessage(err) })
    }
  },
})

async function fetchModelData(
  crawlArgs: { uptimes: boolean; apps: boolean },
  model: z4.infer<typeof ModelsDataRecordArray>[number],
) {
  const result: CrawlArchiveBundle['data']['models'][number] = {
    model,
    endpoints: [],
    uptimes: [],
    apps: [],
  }

  if (!model.endpoint) {
    return result
  }

  // * endpoints
  try {
    const endpoints = await orFetch('/api/frontend/stats/endpoint', {
      params: { permaslug: model.permaslug, variant: model.endpoint.variant },
      schema: EndpointsDataRecordArray,
    })
    result.endpoints = endpoints
  } catch (err) {
    console.error('[crawl:endpoints]', {
      params: { permaslug: model.permaslug, variant: model.endpoint.variant },
      error: getErrorMessage(err),
    })
  }

  // * uptimes
  if (crawlArgs.uptimes && result.endpoints.length) {
    for (const { id } of result.endpoints) {
      try {
        const uptime = await orFetch('/api/frontend/stats/uptime-hourly', {
          params: { id },
          schema: DataRecord,
        })
        result.uptimes.push([id, uptime])
      } catch (err) {
        console.error('[crawl:uptimes]', { id, error: getErrorMessage(err) })
      }
    }
  }

  // * apps
  if (crawlArgs.apps && result.endpoints.length) {
    try {
      const apps = await orFetch('/api/frontend/stats/app', {
        params: { permaslug: model.permaslug, variant: model.endpoint.variant },
        schema: DataRecordArray,
      })
      result.apps = apps
    } catch (err) {
      console.error('[crawl:apps]', {
        params: { permaslug: model.permaslug, variant: model.endpoint.variant },
        error: getErrorMessage(err),
      })
    }
  }

  return result
}

export async function storeCrawlBundle(ctx: ActionCtx, bundle: CrawlArchiveBundle) {
  const parsed = CrawlArchiveBundleSchema.parse(bundle)
  const jsonString = JSON.stringify(parsed)
  const encoded = new TextEncoder().encode(jsonString)
  const blob = new Blob([gzipSync(encoded)])
  const storage_id = await ctx.storage.store(blob)

  const size = {
    raw: encoded.byteLength,
    blob: blob.size,
  }

  const totals = {
    models: parsed.data.models.length,
    endpoints: parsed.data.models.reduce((sum, m) => sum + m.endpoints.length, 0),
    apps: parsed.data.models.reduce((sum, m) => sum + m.apps.length, 0),
    uptimes: parsed.data.models.reduce((sum, m) => sum + m.uptimes.length, 0),
    providers: parsed.data.providers.length,
    modelAuthors: parsed.data.modelAuthors.length,
  }

  await ctx.runMutation(internal.db.snapshot.crawlArchives.insert, {
    crawl_id: parsed.crawl_id,
    storage_id,
    data: {
      totals,
      size,
    },
  })

  console.log(`[crawl:store]`, {
    crawl_id: parsed.crawl_id,
    totals,
    size: {
      raw: prettyBytes(size.raw),
      blob: prettyBytes(size.blob),
      ratio: Math.round((size.blob / size.raw) * 1000) / 1000,
    },
  })
}
