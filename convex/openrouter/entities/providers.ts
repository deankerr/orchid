import { v } from 'convex/values'
import z4 from 'zod/v4'
import { internal } from '../../_generated/api'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import { ProviderStrictSchema, ProviderTransformSchema } from '../../or/or_providers_validators'
import { OrProvidersFn, OrProviders, type OrProviderFields } from '../../or/or_providers'
import { orFetch } from '../client'
import type { EntitySyncData, Issue, SyncConfig } from '../types'
import { validateArray } from '../validation'
import { storeSnapshotData } from '../archives'

/**
 * Sync all providers from OpenRouter
 */
export async function syncProviders(
  ctx: ActionCtx,
  config: SyncConfig,
): Promise<{ providers: EntitySyncData<OrProviderFields> }> {
  try {
    // Fetch provider data
    const response = await orFetch('/api/frontend/all-providers', {
      schema: z4.object({ data: z4.unknown().array() }),
    })

    // Store raw response in archives
    await storeSnapshotData(ctx, {
      run_id: config.runId,
      snapshot_at: config.snapshotAt,
      type: 'providers',
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

    // Add snapshot_at to each provider
    const providers = providerData.map((provider) => ({
      ...provider,
      snapshot_at: config.snapshotAt,
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
    providers: v.array(v.object(OrProviders.withoutSystemFields)),
  },
  handler: async (ctx: MutationCtx, { providers }) => {
    const results = await Promise.all(
      providers.map(async (provider) => {
        const mergeResult = await OrProvidersFn.merge(ctx, { provider })
        return {
          identifier: provider.slug,
          action: mergeResult.action,
        }
      }),
    )
    return results
  },
})
