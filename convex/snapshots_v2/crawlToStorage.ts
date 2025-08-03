import { v } from 'convex/values'
import z4 from 'zod/v4'

import { gzipSync } from 'fflate'
import { up } from 'up-fetch'

import { internal } from '../_generated/api'
import { internalAction, type ActionCtx } from '../_generated/server'

export const orFetch = up(fetch, () => ({
  baseUrl: 'https://openrouter.ai',
  retry: {
    attempts: 2,
    delay: (ctx) => ctx.attempt ** 2 * 1000,
  },
}))

const ModelsSchema = z4
  .object({
    data: z4.array(
      z4.object({
        permaslug: z4.string(),
        endpoint: z4.object({ variant: z4.string() }).nullable(),
      }),
    ),
  })
  .transform((v) =>
    v.data.map(({ permaslug, endpoint }) => {
      return {
        permaslug,
        variant: endpoint?.variant,
      }
    }),
  )

const EndpointsSchema = z4
  .object({
    data: z4.array(
      z4.object({
        id: z4.string(),
      }),
    ),
  })
  .transform((v) => v.data.map((v) => v.id))

export const run = internalAction({
  args: {
    providers: v.boolean(),
    models: v.boolean(),
    endpoints: v.boolean(),
    apps: v.boolean(),
    uptimes: v.boolean(),
    modelAuthors: v.boolean(),
  },
  handler: async (ctx, args) => {
    const runId = Date.now().toString()

    console.log(`Starting crawl ${runId}:`, args)

    // * Fetch providers first - independent of models
    if (args.providers) {
      await fetchProviders(ctx, runId, args)
    }

    // * Fetch models if requested - exit early if not
    if (!args.models) {
      console.log(`Completed crawl ${runId}: models disabled`)
      return runId
    }

    const modelsPath = '/api/frontend/models'
    const modelsData = await orFetch(modelsPath)
    await storeRawData(ctx, runId, modelsPath, modelsData)
    const models = ModelsSchema.parse(modelsData)

    console.log(`Models fetched: ${models.length}`)

    // * Process models for endpoints, apps, and uptimes
    await processModels(ctx, runId, models, args)

    // * Extract author slugs and fetch model author data
    if (args.modelAuthors) {
      const authorSlugs = new Set(
        models.map((model) => model.permaslug.split('/')[0]).filter(Boolean),
      )
      await fetchModelAuthors(ctx, runId, authorSlugs, args)
    }

    console.log(`Completed crawl ${runId}`)
    return runId
  },
})

async function fetchProviders(ctx: ActionCtx, runId: string, _args: any) {
  try {
    const providersPath = '/api/frontend/all-providers'
    const providersData = await orFetch(providersPath)
    await storeRawData(ctx, runId, providersPath, providersData)
  } catch (error) {
    console.error('Failed to fetch providers:', (error as Error).message)
  }
}

async function processModels(ctx: ActionCtx, runId: string, models: any[], args: any) {
  let processedCount = 0
  let errorCount = 0
  let uptimeCount = 0
  let uptimeErrors = 0

  for (const model of models) {
    try {
      // Only fetch variant-dependent endpoints if variant exists
      if (model.variant) {
        let endpointUuids: string[] = []

        // Fetch endpoints if enabled
        if (args.endpoints) {
          try {
            const endpointsPath = `/api/frontend/stats/endpoint?permaslug=${model.permaslug}&variant=${model.variant}`
            const endpointsData = await orFetch(endpointsPath)
            await storeRawData(ctx, runId, endpointsPath, endpointsData)

            const endpoints = EndpointsSchema.parse(endpointsData)
            endpointUuids = endpoints
          } catch (error) {
            console.error(
              `Failed endpoints for ${model.permaslug}:${model.variant}:`,
              (error as Error).message,
            )
            errorCount++
          }
        }

        // Fetch apps if enabled
        if (args.apps) {
          try {
            const appsPath = `/api/frontend/stats/app?permaslug=${model.permaslug}&variant=${model.variant}`
            const appsData = await orFetch(appsPath)
            await storeRawData(ctx, runId, appsPath, appsData)
          } catch (error) {
            console.error(
              `Failed apps for ${model.permaslug}:${model.variant}:`,
              (error as Error).message,
            )
            errorCount++
          }
        }

        // Fetch uptimes for this model's endpoints if enabled
        if (args.uptimes) {
          for (const uuid of endpointUuids) {
            try {
              const uptimesPath = `/api/frontend/stats/uptime-hourly?id=${uuid}`
              const uptimesData = await orFetch(uptimesPath)
              await storeRawData(ctx, runId, uptimesPath, uptimesData)
              uptimeCount++
            } catch (error) {
              console.error(`Failed uptime for ${uuid}:`, (error as Error).message)
              uptimeErrors++
            }
          }
        }

        processedCount++
      }
    } catch (error) {
      console.error(`Failed model ${model.permaslug}:`, (error as Error).message)
      errorCount++
    }
  }

  console.log(`Models: ${processedCount} processed, ${errorCount} errors`)
  if (args.uptimes) {
    console.log(`Uptimes: ${uptimeCount} fetched, ${uptimeErrors} errors`)
  }
}

async function fetchModelAuthors(
  ctx: ActionCtx,
  runId: string,
  authorSlugs: Set<string>,
  _args: any,
) {
  let successCount = 0
  let errorCount = 0

  for (const authorSlug of authorSlugs) {
    try {
      const authorPath = `/api/frontend/model-author?authorSlug=${authorSlug}&shouldIncludeStats=true&shouldIncludeVariants=false`
      const authorData = await orFetch(authorPath)
      await storeRawData(ctx, runId, authorPath, authorData)
      successCount++
    } catch (error) {
      console.error(`Failed author ${authorSlug}:`, (error as Error).message)
      errorCount++
    }
  }

  console.log(`Authors: ${successCount} fetched, ${errorCount} errors`)
}

async function storeRawData(ctx: ActionCtx, runId: string, path: string, data: any) {
  try {
    const jsonString = JSON.stringify(data)
    const compressed = gzipSync(new TextEncoder().encode(jsonString))

    const blob = new Blob([compressed])
    const storageId = await ctx.storage.store(blob)

    await ctx.runMutation(internal.db.snapshot.rawArchives.insert, {
      runId,
      path,
      storageId,
    })
  } catch (error) {
    console.error(`Failed storage for ${path}:`, (error as Error).message)
    throw error // Re-throw storage errors as they indicate system issues
  }
}
