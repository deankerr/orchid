import { v } from 'convex/values'
import z4 from 'zod/v4'
import { internal } from '../../_generated/api'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import { storeJSON } from '../../files'
import { ProviderStrictSchema, ProviderTransformSchema } from '../../provider_views/schemas'
import { ProviderViewFn, ProviderViews, type ProviderView } from '../../provider_views/table'
import { orFetch } from '../client'
import type { EntitySyncData, Issue, SyncConfig } from '../types'
import { validateArray } from '../validation'

/**
 * Sync all providers from OpenRouter
 */
export async function syncProviders(
  ctx: ActionCtx,
  config: SyncConfig,
): Promise<{ providers: EntitySyncData<ProviderView> }> {
  try {
    // Fetch provider data
    const response = await orFetch('/api/frontend/all-providers', {
      schema: z4.object({ data: z4.unknown().array() }),
    })

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

    // Convert validation issues to Issue format
    const issues: Issue[] = validationIssues.map((issue) => ({
      ...issue,
      identifier: `providers:${issue.index}`,
    }))

    // Add epoch to each provider
    const providers = providerData.map((provider) => ({
      ...provider,
      epoch: config.epoch,
    }))

    // Merge providers into database
    const mergeResults = await ctx.runMutation(internal.openrouter.entities.providers.mergeProviders, {
      providers,
    })

    console.log('Providers complete')
    return {
      providers: {
        items: providers,
        issues,
        mergeResults,
      },
    }
  } catch (error) {
    // Return empty data with sync error
    return {
      providers: {
        items: [],
        issues: [
          {
            type: 'sync',
            identifier: 'providers',
            message: error instanceof Error ? error.message : 'Unknown error during provider fetch',
          },
        ],
        mergeResults: [],
      },
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
    const results = await Promise.all(
      providers.map(async (provider) => {
        const mergeResult = await ProviderViewFn.merge(ctx, { provider })
        return {
          identifier: provider.slug,
          action: mergeResult.action,
        }
      }),
    )
    return results
  },
})
