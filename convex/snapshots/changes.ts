import { omit } from 'convex-helpers'
import { v } from 'convex/values'

import { diff } from 'json-diff-ts'

import { internal } from '../_generated/api'
import { internalAction, type ActionCtx } from '../_generated/server'
import type { ChangesTableFields } from '../lib/changesTable'
import { getErrorMessage } from '../shared'
import { getArchiveBundle } from './bundle'
import type { CrawlArchiveBundle } from './crawl'

export const processChanges = internalAction({
  args: {
    current_crawl_id: v.string(),
    from_crawl_id: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log(`[changes]`, {
      current: args.current_crawl_id,
      from: args.from_crawl_id,
    })

    try {
      // * Get both bundles
      const [currentBundle, previousBundle] = await Promise.all([
        getArchiveBundle(ctx, args.current_crawl_id),
        getArchiveBundle(ctx, args.from_crawl_id),
      ])

      if (!currentBundle) {
        console.error(`[changes] current bundle not found`, {
          crawl_id: args.current_crawl_id,
        })
        return null
      }

      if (!previousBundle) {
        console.error(`[changes] previous bundle not found`, {
          crawl_id: args.from_crawl_id,
        })
        return null
      }

      // Process each entity type
      await Promise.all([
        processModelChanges(ctx, {
          currentBundle,
          previousBundle,
        }),
        processEndpointChanges(ctx, {
          currentBundle,
          previousBundle,
        }),
        processProviderChanges(ctx, {
          currentBundle,
          previousBundle,
        }),
      ])

      console.log(`[changes] complete`)
    } catch (err) {
      console.error(`[changes] failed`, {
        error: getErrorMessage(err),
        current: args.current_crawl_id,
        from: args.from_crawl_id,
      })
    }

    return null
  },
})

async function processModelChanges(
  ctx: ActionCtx,
  args: {
    currentBundle: CrawlArchiveBundle
    previousBundle: CrawlArchiveBundle
  },
) {
  // * Create maps for easy lookup by slug
  const currentModelsMap = new Map()
  for (const modelEntry of args.currentBundle.data.models) {
    currentModelsMap.set(
      modelEntry.model.slug,
      omit(modelEntry.model, ['endpoints', 'uptimes', 'apps']),
    )
  }

  const previousModelsMap = new Map()
  for (const modelEntry of args.previousBundle.data.models) {
    previousModelsMap.set(
      modelEntry.model.slug,
      omit(modelEntry.model, ['endpoints', 'uptimes', 'apps']),
    )
  }

  // * Process changes
  const allSlugs = new Set([...currentModelsMap.keys(), ...previousModelsMap.keys()])
  const changes: ChangesTableFields[] = []

  for (const slug of allSlugs) {
    const currentModel = currentModelsMap.get(slug)
    const previousModel = previousModelsMap.get(slug)

    // Added
    if (currentModel && !previousModel) {
      changes.push({
        entity_id: slug,
        entity_name: currentModel.name,
        event_type: 'add' as const,
        crawl_id: args.currentBundle.crawl_id,
        from_crawl_id: args.previousBundle.crawl_id,
      })
      continue
    }

    // Removed
    if (!currentModel && previousModel) {
      changes.push({
        entity_id: slug,
        entity_name: previousModel.name,
        event_type: 'remove' as const,
        crawl_id: args.currentBundle.crawl_id,
        from_crawl_id: args.previousBundle.crawl_id,
      })
      continue
    }

    // Updated
    if (currentModel && previousModel) {
      const modelDiff = diff(previousModel, currentModel, {
        keysToSkip: ['endpoint'],
        embeddedObjKeys: { input_modalities: '$value', output_modalities: '$value' },
        treatTypeChangeAsReplace: false,
      })

      for (const diffItem of modelDiff) {
        changes.push({
          entity_id: slug,
          entity_name: currentModel.name,
          event_type: 'update' as const,
          crawl_id: args.currentBundle.crawl_id,
          from_crawl_id: args.previousBundle.crawl_id,
          change_key: diffItem.key,
          change_raw: diffItem,
        })
      }
    }
  }

  // * Insert changes
  if (changes.length > 0) {
    await ctx.runMutation(internal.db.or.modelChanges.insertEvents, { events: changes })
  }

  // * Log stats
  const stats = {
    total: allSlugs.size,
    added: changes.filter((c) => c.event_type === 'add').length,
    removed: changes.filter((c) => c.event_type === 'remove').length,
    updated: changes.filter((c) => c.event_type === 'update').length,
    changes: changes.length,
  }

  console.log(`[changes:models]`, stats)
}

async function processEndpointChanges(
  ctx: ActionCtx,
  args: {
    currentBundle: CrawlArchiveBundle
    previousBundle: CrawlArchiveBundle
  },
) {
  // * Extract endpoints from bundles
  const currentEndpointsMap = new Map()
  for (const modelEntry of args.currentBundle.data.models) {
    const endpoints = modelEntry.endpoints || []
    for (const endpoint of endpoints) {
      currentEndpointsMap.set(endpoint.id, endpoint)
    }
  }

  const previousEndpointsMap = new Map()
  for (const modelEntry of args.previousBundle.data.models) {
    const endpoints = modelEntry.endpoints || []
    for (const endpoint of endpoints) {
      previousEndpointsMap.set(endpoint.id, endpoint)
    }
  }

  // * Process changes
  const allIds = new Set([...currentEndpointsMap.keys(), ...previousEndpointsMap.keys()])
  const changes: ChangesTableFields[] = []

  for (const id of allIds) {
    const currentEndpoint = currentEndpointsMap.get(id)
    const previousEndpoint = previousEndpointsMap.get(id)

    // Added
    if (currentEndpoint && !previousEndpoint) {
      changes.push({
        entity_id: id,
        entity_name: currentEndpoint.name,
        event_type: 'add' as const,
        crawl_id: args.currentBundle.crawl_id,
        from_crawl_id: args.previousBundle.crawl_id,
      })
      continue
    }

    // Removed
    if (!currentEndpoint && previousEndpoint) {
      changes.push({
        entity_id: id,
        entity_name: previousEndpoint.name,
        event_type: 'remove' as const,
        crawl_id: args.currentBundle.crawl_id,
        from_crawl_id: args.previousBundle.crawl_id,
      })
      continue
    }

    // Updated
    if (currentEndpoint && previousEndpoint) {
      const endpointDiff = diff(previousEndpoint, currentEndpoint, {
        keysToSkip: ['stats', 'provider_info', 'model'],
        embeddedObjKeys: { supported_parameters: '$value' },
        treatTypeChangeAsReplace: false,
      })

      for (const diffItem of endpointDiff) {
        changes.push({
          entity_id: id,
          entity_name: currentEndpoint.name,
          event_type: 'update' as const,
          crawl_id: args.currentBundle.crawl_id,
          from_crawl_id: args.previousBundle.crawl_id,
          change_key: diffItem.key,
          change_raw: diffItem,
        })
      }
    }
  }

  // * Insert changes
  if (changes.length > 0) {
    await ctx.runMutation(internal.db.or.endpointChanges.insertEvents, { events: changes })
  }

  // * Log stats
  const stats = {
    total: allIds.size,
    added: changes.filter((c) => c.event_type === 'add').length,
    removed: changes.filter((c) => c.event_type === 'remove').length,
    updated: changes.filter((c) => c.event_type === 'update').length,
    changes: changes.length,
  }

  console.log(`[changes:endpoints]`, stats)
}

async function processProviderChanges(
  ctx: ActionCtx,
  args: {
    currentBundle: CrawlArchiveBundle
    previousBundle: CrawlArchiveBundle
  },
) {
  // * Create maps for easy lookup by slug
  const currentProvidersMap = new Map()
  for (const provider of args.currentBundle.data.providers) {
    currentProvidersMap.set(provider.slug, provider)
  }

  const previousProvidersMap = new Map()
  for (const provider of args.previousBundle.data.providers) {
    previousProvidersMap.set(provider.slug, provider)
  }

  // * Process changes
  const allSlugs = new Set([...currentProvidersMap.keys(), ...previousProvidersMap.keys()])
  const changes: ChangesTableFields[] = []

  for (const slug of allSlugs) {
    const currentProvider = currentProvidersMap.get(slug)
    const previousProvider = previousProvidersMap.get(slug)

    // Added
    if (currentProvider && !previousProvider) {
      changes.push({
        entity_id: slug,
        entity_name: currentProvider.name || slug,
        event_type: 'add' as const,
        crawl_id: args.currentBundle.crawl_id,
        from_crawl_id: args.previousBundle.crawl_id,
      })
      continue
    }

    // Removed
    if (!currentProvider && previousProvider) {
      changes.push({
        entity_id: slug,
        entity_name: previousProvider.name || slug,
        event_type: 'remove' as const,
        crawl_id: args.currentBundle.crawl_id,
        from_crawl_id: args.previousBundle.crawl_id,
      })
      continue
    }

    // Updated
    if (currentProvider && previousProvider) {
      const providerDiff = diff(previousProvider, currentProvider, {
        keysToSkip: ['ignoredProviderModels'],
        treatTypeChangeAsReplace: false,
      })

      for (const diffItem of providerDiff) {
        changes.push({
          entity_id: slug,
          entity_name: currentProvider.name || slug,
          event_type: 'update' as const,
          crawl_id: args.currentBundle.crawl_id,
          from_crawl_id: args.previousBundle.crawl_id,
          change_key: diffItem.key,
          change_raw: diffItem,
        })
      }
    }
  }

  // * Insert changes
  if (changes.length > 0) {
    await ctx.runMutation(internal.db.or.providerChanges.insertEvents, { events: changes })
  }

  // * Log stats
  const stats = {
    total: allSlugs.size,
    added: changes.filter((c) => c.event_type === 'add').length,
    removed: changes.filter((c) => c.event_type === 'remove').length,
    updated: changes.filter((c) => c.event_type === 'update').length,
    changes: changes.length,
  }

  console.log(`[changes:providers]`, stats)
}
