import z4 from 'zod/v4'
import { v } from 'convex/values'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import { internal } from '../../_generated/api'
import { orFetch } from '../client'
import { AppViewFn, AppViews, type AppView } from '../../app_views/table'
import { AppTokenStatsFn, AppTokenStats } from '../../app_token_stats/table'
import { AppStrictSchema, AppTransformSchema } from '../../app_views/schemas'
import { validateArray } from '../validation'
import type { EntitySyncData, SyncConfig, MergeResult } from '../types'
import type { ModelView } from '../../model_views/table'
import { storeJSON } from '../../files'

// Batch size for large arrays to avoid Convex limits
const APP_TOKEN_BATCH_SIZE = 2000

/**
 * Sync apps and app tokens for given models
 */
export async function syncApps(
  ctx: ActionCtx,
  config: SyncConfig,
  models: ModelView[],
): Promise<{
  apps: EntitySyncData<AppView>
  appTokens: EntitySyncData<AppTokenStats>
}> {
  const appsMap = new Map<number, AppView>()
  const allAppTokens: AppTokenStats[] = []
  const allValidationIssues: any[] = []
  const allMergeResults: MergeResult[] = []

  console.log(`Processing apps for ${models.length} models...`)

  for (const model of models) {
    try {
      // Sync apps and app token stats for each model variant
      for (const variant of model.variants) {
        const appData = await syncModelApps(ctx, config, model, variant)
        allAppTokens.push(...appData.appTokens)
        allValidationIssues.push(...appData.validationIssues)

        // Dedupe apps by app_id
        for (const app of appData.apps) {
          if (!appsMap.has(app.app_id)) {
            appsMap.set(app.app_id, app)
          }
        }
      }
    } catch (error) {
      allMergeResults.push({
        identifier: model.slug,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown app processing error',
      })
    }
  }

  const apps = Array.from(appsMap.values())

  try {
    // Merge apps
    const appResults = await ctx.runMutation(internal.openrouter.entities.apps.mergeApps, {
      apps,
    })

    // Merge app tokens in batches to avoid Convex limits and timeouts
    const appTokenResults: MergeResult[] = []
    console.log(`Batching ${allAppTokens.length} app tokens...`)

    for (let i = 0; i < allAppTokens.length; i += APP_TOKEN_BATCH_SIZE) {
      const batch = allAppTokens.slice(i, i + APP_TOKEN_BATCH_SIZE)
      console.log(
        `Processing app token batch ${Math.floor(i / APP_TOKEN_BATCH_SIZE) + 1} (${batch.length} items)`,
      )

      const batchResults = await ctx.runMutation(internal.openrouter.entities.apps.mergeAppTokens, {
        appTokens: batch,
      })
      appTokenResults.push(...batchResults)
    }

    return {
      apps: {
        items: apps,
        validationIssues: allValidationIssues,
        mergeResults: appResults,
      },
      appTokens: {
        items: allAppTokens,
        validationIssues: [],
        mergeResults: appTokenResults,
      },
    }
  } catch (error) {
    return {
      apps: {
        items: [],
        validationIssues: allValidationIssues,
        mergeResults: allMergeResults,
        fetchError: error instanceof Error ? error.message : 'Unknown error during apps merge',
      },
      appTokens: {
        items: [],
        validationIssues: [],
        mergeResults: [],
      },
    }
  }
}

// Helper function
async function syncModelApps(
  ctx: ActionCtx,
  config: SyncConfig,
  model: ModelView,
  variant: string,
): Promise<{ apps: AppView[]; appTokens: AppTokenStats[]; validationIssues: any[] }> {
  try {
    const response = await orFetch('/api/frontend/stats/app', {
      params: {
        permaslug: model.permaslug,
        variant,
        limit: 20,
      },
      schema: z4.object({ data: z4.unknown().array() }),
    })

    // Store raw response
    const snapshotKey = `openrouter-apps-${model.slug}-${variant}-snapshot-${config.snapshotStartTime}`
    await storeJSON(ctx, {
      key: snapshotKey,
      epoch: config.epoch,
      compress: config.compress,
      data: response,
    })

    const { items, issues } = validateArray(response.data, AppTransformSchema, AppStrictSchema)

    const apps: AppView[] = []
    const appTokens: AppTokenStats[] = []

    for (const item of items) {
      apps.push({
        ...item.app,
        epoch: config.epoch,
      })
      appTokens.push({
        ...item.appTokens,
        model_permaslug: model.permaslug,
        model_slug: model.slug,
        model_variant: variant,
        epoch: config.epoch,
      })
    }

    return { apps, appTokens, validationIssues: issues }
  } catch (error) {
    return {
      apps: [],
      appTokens: [],
      validationIssues: [
        {
          type: 'fetch_error',
          message: error instanceof Error ? error.message : 'Unknown app fetch error',
          model: model.slug,
          variant,
        },
      ],
    }
  }
}

// Merge mutations
export const mergeApps = internalMutation({
  args: { apps: v.array(v.object(AppViews.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { apps }) => {
    const results: MergeResult[] = []
    for (const app of apps) {
      try {
        const mergeResult = await AppViewFn.merge(ctx, { app })
        results.push({
          identifier: app.app_id.toString(),
          action: mergeResult.action,
          docId: mergeResult.docId,
          changes: mergeResult.changes,
        })
      } catch (error) {
        results.push({
          identifier: app.app_id.toString(),
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown app merge error',
        })
      }
    }
    return results
  },
})

export const mergeAppTokens = internalMutation({
  args: { appTokens: v.array(v.object(AppTokenStats.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { appTokens }) => {
    const results: MergeResult[] = []
    for (const token of appTokens) {
      try {
        const mergeResult = await AppTokenStatsFn.merge(ctx, { appTokenStats: token })
        results.push({
          identifier: token.app_id.toString(),
          action: mergeResult.action,
          docId: mergeResult.docId,
          changes: mergeResult.changes,
        })
      } catch (error) {
        results.push({
          identifier: token.app_id.toString(),
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown app token merge error',
        })
      }
    }
    return results
  },
})
