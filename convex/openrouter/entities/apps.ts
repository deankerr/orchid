import { v } from 'convex/values'
import z4 from 'zod/v4'
import { internal } from '../../_generated/api'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import { AppTokenStats, AppTokenStatsFn } from '../../app_token_stats/table'
import { AppStrictSchema, AppTransformSchema } from '../../app_views/schemas'
import { AppViewFn, AppViews, type AppView } from '../../app_views/table'
import { storeJSON } from '../../files'
import type { ModelView } from '../../model_views/table'
import { orFetch } from '../client'
import type { EntitySyncData, Issue, MergeResult, SyncConfig } from '../types'
import { validateArray } from '../validation'

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
  const allIssues: Issue[] = []

  console.log(`Processing apps for ${models.length} models...`)

  for (const model of models) {
    // Process each model variant
    for (const variant of model.variants) {
      const appData = await syncModelApps(ctx, config, model, variant)
      allAppTokens.push(...appData.appTokens)
      allIssues.push(...appData.issues)

      // Dedupe apps by app_id
      for (const app of appData.apps) {
        if (!appsMap.has(app.app_id)) {
          appsMap.set(app.app_id, app)
        }
      }
    }
  }

  const apps = Array.from(appsMap.values())

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
      issues: allIssues.filter((issue) => !issue.identifier.includes('token')),
      mergeResults: appResults,
    },
    appTokens: {
      items: allAppTokens,
      issues: allIssues.filter((issue) => issue.identifier.includes('token')),
      mergeResults: appTokenResults,
    },
  }
}

// Helper function
async function syncModelApps(
  ctx: ActionCtx,
  config: SyncConfig,
  model: ModelView,
  variant: string,
): Promise<{ apps: AppView[]; appTokens: AppTokenStats[]; issues: Issue[] }> {
  const modelVariantId = `${model.slug}-${variant}`

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

    const { items, issues: validationIssues } = validateArray(
      response.data,
      AppTransformSchema,
      AppStrictSchema,
    )

    // Convert validation issues to Issue format
    const issues: Issue[] = validationIssues.map((issue) => ({
      ...issue,
      identifier: `${modelVariantId}:${issue.index}`,
    }))

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

    return { apps, appTokens, issues }
  } catch (error) {
    return {
      apps: [],
      appTokens: [],
      issues: [
        {
          type: 'sync',
          identifier: modelVariantId,
          message: error instanceof Error ? error.message : 'Unknown app fetch error',
        },
      ],
    }
  }
}

export const mergeApps = internalMutation({
  args: { apps: v.array(v.object(AppViews.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { apps }) => {
    const results = await Promise.all(
      apps.map(async (app) => {
        const mergeResult = await AppViewFn.merge(ctx, { app })
        return {
          identifier: app.app_id.toString(),
          action: mergeResult.action,
        }
      }),
    )
    return results
  },
})

export const mergeAppTokens = internalMutation({
  args: { appTokens: v.array(v.object(AppTokenStats.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { appTokens }) => {
    const results = await Promise.all(
      appTokens.map(async (token) => {
        const mergeResult = await AppTokenStatsFn.merge(ctx, { appTokenStats: token })
        return {
          identifier: `${token.app_id}`,
          action: mergeResult.action,
        }
      }),
    )
    return results
  },
})
