import z4 from 'zod/v4'
import { v } from 'convex/values'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import { internal } from '../../_generated/api'
import { orFetch } from '../client'
import { ProviderViewFn, ProviderViews, type ProviderView } from '../../provider_views/table'
import { ProviderStrictSchema, ProviderTransformSchema } from '../../provider_views/schemas'
import { validateArray } from '../validation'
import type { EntitySyncData, SyncConfig, MergeResult } from '../types'
import { storeJSON } from '../../files'

/**
 * Sync all providers from OpenRouter
 */
export async function syncProviders(
  ctx: ActionCtx,
  config: SyncConfig,
): Promise<EntitySyncData<ProviderView>> {
  try {
    // Fetch provider data
    const response = await orFetch('/api/frontend/all-providers', {
      schema: z4.object({ data: z4.unknown().array() }),
    })

    // Store raw response (with compression control)
    const snapshotKey = `openrouter-providers-snapshot-${config.snapshotStartTime}`
    await storeJSON(ctx, {
      key: snapshotKey,
      epoch: config.epoch,
      compress: config.compress,
      data: response,
    })

    // Validate and transform
    const { items: providerData, issues: validationIssues } = validateArray(
      response.data,
      ProviderTransformSchema,
      ProviderStrictSchema,
    )

    // Add epoch to each provider
    const providers = providerData.map((provider) => ({
      ...provider,
      epoch: config.epoch,
    }))

    // Merge providers into database
    const mergeResults = await ctx.runMutation(internal.openrouter.entities.providers.mergeProviders, {
      providers,
    })

    return {
      items: providers,
      validationIssues,
      mergeResults,
    }
  } catch (error) {
    // Return empty data with fetch error
    return {
      items: [],
      validationIssues: [],
      mergeResults: [],
      fetchError: error instanceof Error ? error.message : 'Unknown error during provider fetch',
    }
  }
}

/**
 * Internal mutation to merge providers
 */
export const mergeProviders = internalMutation({
  args: {
    providers: v.array(v.object(ProviderViews.withoutSystemFields)),
  },
  handler: async (ctx: MutationCtx, { providers }) => {
    const results: MergeResult[] = []

    for (const provider of providers) {
      try {
        const mergeResult = await ProviderViewFn.merge(ctx, { provider })

        results.push({
          identifier: provider.slug,
          action: mergeResult.action,
          docId: mergeResult.docId,
          changes: mergeResult.changes,
        })
      } catch (error) {
        results.push({
          identifier: provider.slug,
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown merge error',
        })
      }
    }

    return results
  },
})
