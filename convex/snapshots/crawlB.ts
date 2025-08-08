import { v } from 'convex/values'
import z4 from 'zod/v4'

import { gzipSync } from 'fflate'
import prettyBytes from 'pretty-bytes'
import { up } from 'up-fetch'

import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
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

export const run = internalAction({
  args: {
    apps: v.boolean(),
    uptimes: v.boolean(),
    modelAuthors: v.boolean(),
  },
  handler: async (ctx, args) => {
    const crawl_id = Date.now().toString()
    console.log(`[crawl]`, { crawl_id, ...args })

    const crawlData: Record<string, unknown[]> = {
      models: [],
    }

    // * providers
    try {
      crawlData.providers = await orFetch('/api/frontend/all-providers', {
        schema: DataRecordArray,
      })
    } catch (err) {
      console.error('[crawl.providers]', { error: getErrorMessage(err) })
    }

    // * models
    const models = await orFetch('/api/frontend/models', { schema: ModelsDataRecordArray })

    for (const model of models) {
      const modelData = await fetchModelData(args, model)
      crawlData.models.push(modelData)
    }

    // * modelAuthors
    if (args.modelAuthors) {
      const modelAuthors: unknown[] = []
      const authorSlugs = new Set(models.map((model) => model.author))

      for (const authorSlug of authorSlugs) {
        try {
          const modelAuthor = await orFetch('/api/frontend/model-author', {
            params: { authorSlug },
            schema: DataRecord,
          })
          modelAuthors.push(modelAuthor)
        } catch (err) {
          console.error('[crawl.modelAuthors]', { authorSlug, error: getErrorMessage(err) })
        }
      }

      crawlData.modelAuthors = modelAuthors
    }

    try {
      const jsonString = JSON.stringify(crawlData)
      const encoded = new TextEncoder().encode(jsonString)
      const blob = new Blob([gzipSync(encoded)])
      const storageId = await ctx.storage.store(blob)

      const archive_id = await ctx.runMutation(internal.db.snapshot.rawArchives.insert, {
        crawlId: crawl_id,
        path: 'collected-data.json.gz',
        storageId,
      })

      console.log(`[crawl] complete`, {
        crawl_id,
        args,
        archive_id,
        storage_id: storageId,
        records: {
          models: crawlData.models.length,
          modelAuthors: crawlData.modelAuthors?.length,
          providers: crawlData.providers?.length,
        },
        sizes: {
          raw: prettyBytes(encoded.byteLength),
          blob: prettyBytes(blob.size),
          ratio: Math.round((blob.size / encoded.byteLength) * 1000) / 1000,
        },
      })
    } catch (err) {
      console.error('[crawl] failed', { crawl_id, args, error: getErrorMessage(err) })
    }
  },
})

async function fetchModelData(
  crawlArgs: { uptimes: boolean; apps: boolean },
  model: z4.infer<typeof ModelsDataRecordArray>[number],
) {
  if (!model.endpoint) {
    return { model }
  }

  // * endpoints
  let endpoints: z4.infer<typeof EndpointsDataRecordArray> | undefined
  try {
    endpoints = await orFetch('/api/frontend/stats/endpoint', {
      params: { permaslug: model.permaslug, variant: model.endpoint.variant },
      schema: EndpointsDataRecordArray,
    })
  } catch (err) {
    console.error('[crawl.endpoints]', {
      params: { permaslug: model.permaslug, variant: model.endpoint.variant },
      error: getErrorMessage(err),
    })
  }

  // * uptimes
  let uptimes: unknown[] | undefined
  if (endpoints && crawlArgs.uptimes) {
    uptimes = []
    for (const { id } of endpoints) {
      try {
        const uptime = await orFetch('/api/frontend/stats/uptime-hourly', {
          params: { id },
          schema: DataRecord,
        })
        uptimes.push(uptime)
      } catch (err) {
        console.error('[crawl.uptimes]', { id, error: getErrorMessage(err) })
      }
    }
  }

  // * apps
  let apps: unknown[] | undefined
  if (endpoints && crawlArgs.apps) {
    try {
      apps = await orFetch('/api/frontend/stats/app', {
        params: { permaslug: model.permaslug, variant: model.endpoint.variant },
        schema: DataRecordArray,
      })
    } catch (err) {
      console.error('[crawl.apps]', {
        params: { permaslug: model.permaslug, variant: model.endpoint.variant },
        error: getErrorMessage(err),
      })
    }
  }

  return { model, endpoints, uptimes, apps }
}
