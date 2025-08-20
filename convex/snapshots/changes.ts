import { omit } from 'convex-helpers'
import { v } from 'convex/values'

import { diff } from 'json-diff-ts'

import { internal } from '../_generated/api'
import { internalAction, type ActionCtx } from '../_generated/server'
import type { ChangesTableFields } from '../lib/changesTable'
import { getArchiveBundle } from './bundle'
import type { CrawlArchiveBundle } from './crawl'

const entityConfigs = {
  models: {
    extractId: (entity: any) => entity.slug,
    extractName: (entity: any) => entity.name ?? entity.slug,
    diffOptions: {
      keysToSkip: ['endpoint'],
      embeddedObjKeys: { input_modalities: '$value', output_modalities: '$value' },
      treatTypeChangeAsReplace: false,
    },
    insertMutation: internal.db.or.modelChanges.insertEvents,
  },
  endpoints: {
    extractId: (entity: any) => entity.id,
    extractName: (entity: any) => entity.name ?? entity.id,
    diffOptions: {
      keysToSkip: ['stats', 'provider_info', 'model'],
      embeddedObjKeys: { supported_parameters: '$value' },
      treatTypeChangeAsReplace: false,
    },
    insertMutation: internal.db.or.endpointChanges.insertEvents,
  },
  providers: {
    extractId: (entity: any) => entity.slug,
    extractName: (entity: any) => entity.name ?? entity.slug,
    diffOptions: {
      keysToSkip: ['ignoredProviderModels'],
      treatTypeChangeAsReplace: false,
    },
    insertMutation: internal.db.or.providerChanges.insertEvents,
  },
}

async function processEntityChanges<K extends keyof typeof entityConfigs>(
  ctx: ActionCtx,
  entityType: K,
  args: {
    currentMap: Map<string, any>
    previousMap: Map<string, any>
    currentCrawlId: string
    previousCrawlId: string
  },
) {
  const config = entityConfigs[entityType]
  const allIds = new Set([...args.currentMap.keys(), ...args.previousMap.keys()])
  const changes: ChangesTableFields[] = []

  for (const id of allIds) {
    const currentEntity = args.currentMap.get(id)
    const previousEntity = args.previousMap.get(id)

    // Added
    if (currentEntity && !previousEntity) {
      changes.push({
        entity_id: config.extractId(currentEntity),
        entity_name: config.extractName(currentEntity),
        event_type: 'add' as const,
        crawl_id: args.currentCrawlId,
        from_crawl_id: args.previousCrawlId,
      })
      continue
    }

    // Removed
    if (!currentEntity && previousEntity) {
      changes.push({
        entity_id: config.extractId(previousEntity),
        entity_name: config.extractName(previousEntity),
        event_type: 'remove' as const,
        crawl_id: args.currentCrawlId,
        from_crawl_id: args.previousCrawlId,
      })
      continue
    }

    // Updated
    if (currentEntity && previousEntity) {
      const entityDiff = diff(previousEntity, currentEntity, config.diffOptions)

      for (const diffItem of entityDiff) {
        changes.push({
          entity_id: config.extractId(currentEntity),
          entity_name: config.extractName(currentEntity),
          event_type: 'update' as const,
          crawl_id: args.currentCrawlId,
          from_crawl_id: args.previousCrawlId,
          change_key: diffItem.key,
          change_raw: diffItem,
        })
      }
    }
  }

  // * Insert changes in batches to avoid Convex array length limit (8192)
  if (changes.length > 0) {
    const batchSize = 5000
    for (let i = 0; i < changes.length; i += batchSize) {
      const batch = changes.slice(i, i + batchSize)
      await ctx.runMutation(config.insertMutation, { events: batch })
    }
  }

  // * Log stats
  const stats = {
    total: allIds.size,
    added: changes.filter((c) => c.event_type === 'add').length,
    removed: changes.filter((c) => c.event_type === 'remove').length,
    updated: changes.filter((c) => c.event_type === 'update').length,
    changes: changes.length,
  }

  console.log(`[changes:${entityType}]`, stats)
}

function buildEntityMaps(bundle: CrawlArchiveBundle) {
  // Models/Endpoints
  const modelsMap = new Map()
  const endpointsMap = new Map()
  for (const modelEntry of bundle.data.models) {
    modelsMap.set(modelEntry.model.slug, omit(modelEntry.model, ['endpoints', 'uptimes', 'apps']))

    const endpoints = modelEntry.endpoints || []
    for (const endpoint of endpoints) {
      endpointsMap.set(endpoint.id, endpoint)
    }
  }

  // Providers
  const providersMap = new Map()
  for (const provider of bundle.data.providers) {
    providersMap.set(provider.slug, provider)
  }
  return { modelsMap, endpointsMap, providersMap }
}

async function processChangesForBundlePair(
  ctx: ActionCtx,
  args: {
    current: ReturnType<typeof buildEntityMaps>
    previous: ReturnType<typeof buildEntityMaps>
    currentCrawlId: string
    previousCrawlId: string
  },
) {
  // Skip if any entity type is zero in either bundle
  for (const entity of ['modelsMap', 'endpointsMap', 'providersMap'] as const) {
    if (args.current[entity].size === 0) {
      console.warn('[changes:skip] Skipping due to missing entity type in current bundle', {
        entity,
        crawl_id: args.currentCrawlId,
        current_count: args.current[entity].size,
        previous_count: args.previous[entity].size,
      })
      return
    }
    if (args.previous[entity].size === 0) {
      console.warn('[changes:skip] Skipping due to missing entity type in previous bundle', {
        entity,
        crawl_id: args.previousCrawlId,
        current_count: args.current[entity].size,
        previous_count: args.previous[entity].size,
      })
      return
    }
  }
  // Process each entity type
  await Promise.all([
    processEntityChanges(ctx, 'models', {
      currentMap: args.current.modelsMap,
      previousMap: args.previous.modelsMap,
      currentCrawlId: args.currentCrawlId,
      previousCrawlId: args.previousCrawlId,
    }),
    processEntityChanges(ctx, 'endpoints', {
      currentMap: args.current.endpointsMap,
      previousMap: args.previous.endpointsMap,
      currentCrawlId: args.currentCrawlId,
      previousCrawlId: args.previousCrawlId,
    }),
    processEntityChanges(ctx, 'providers', {
      currentMap: args.current.providersMap,
      previousMap: args.previous.providersMap,
      currentCrawlId: args.currentCrawlId,
      previousCrawlId: args.previousCrawlId,
    }),
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

    // * Get batch of crawl IDs
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

    // * Load first bundle
    let previousBundle = await getArchiveBundle(ctx, crawlIds[0])
    if (!previousBundle) {
      throw new Error(`Failed to load first bundle: ${crawlIds[0]}`)
    }

    // * Process changes between consecutive crawl pairs with bundle reuse
    for (let i = 1; i < crawlIds.length; i++) {
      const currentCrawlId = crawlIds[i]

      console.log('[processAllCrawlArchives] processing pair', {
        from: previousBundle.crawl_id,
        to: currentCrawlId,
        progress: `${i}/${crawlIds.length - 1}`,
      })

      // Load current bundle
      const currentBundle = await getArchiveBundle(ctx, currentCrawlId)
      if (!currentBundle) {
        throw new Error(`Failed to load bundle: ${currentCrawlId}`)
      }

      // Process changes between previous and current bundle
      await processChangesForBundlePair(ctx, {
        current: buildEntityMaps(currentBundle),
        previous: buildEntityMaps(previousBundle),
        currentCrawlId: currentCrawlId,
        previousCrawlId: previousBundle.crawl_id,
      })

      // Current bundle becomes the previous bundle for next iteration
      // This allows the old previousBundle to be garbage collected
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
