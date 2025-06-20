import { v } from 'convex/values'
import z4 from 'zod/v4'
import { internal } from '../../_generated/api'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import {
  OrAppTokenMetrics,
  OrAppTokenMetricsFn,
  type OrAppTokenMetricsFields,
} from '../../or/or_app_token_metrics'
import { AppStrictSchema, AppTransformSchema } from '../../or/or_apps_validators'
import { OrAppsFn, OrApps, type OrAppFields } from '../../or/or_apps'
import { storeJSON } from '../../files'
import type { OrModelFields } from '../../or/or_models'
import { orFetch } from '../client'
import type { EntitySyncData, Issue, SyncConfig } from '../types'
import { processBatchMutation } from '../utils'
import { validateArray } from '../validation'

// Batch size for large arrays to avoid Convex limits
const APP_TOKEN_BATCH_SIZE = 2000

/**
 * Sync apps and app tokens for given models
 */
export async function syncApps(
  ctx: ActionCtx,
  config: SyncConfig,
  models: OrModelFields[],
): Promise<{
  apps: EntitySyncData<OrAppFields>
  appTokens: EntitySyncData<OrAppTokenMetricsFields>
}> {
  const appsMap = new Map<number, OrAppFields>()
  const allAppTokens: OrAppTokenMetricsFields[] = []
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
  const appTokenResults = await processBatchMutation({
    ctx,
    items: allAppTokens,
    batchSize: APP_TOKEN_BATCH_SIZE,
    mutationRef: internal.openrouter.entities.apps.mergeAppTokens,
    mutationArgsKey: 'appTokens',
  })

  console.log('Apps complete')
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
  model: OrModelFields,
  variant: string,
): Promise<{ apps: OrAppFields[]; appTokens: OrAppTokenMetricsFields[]; issues: Issue[] }> {
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
    const snapshotKey = `openrouter-apps-${model.slug}-${variant}-snapshot-${config.startedAt}`
    await storeJSON(ctx, {
      key: snapshotKey,
      snapshot_at: config.snapshotAt,
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

    const apps: OrAppFields[] = []
    const appTokens: OrAppTokenMetricsFields[] = []

    for (const item of items) {
      apps.push({
        ...item.app,
        snapshot_at: config.snapshotAt,
      })
      appTokens.push({
        ...item.appTokens,
        model_permaslug: model.permaslug,
        model_slug: model.slug,
        model_variant: variant,
        snapshot_at: config.snapshotAt,
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
  args: { apps: v.array(v.object(OrApps.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { apps }) => {
    const results = await Promise.all(
      apps.map(async (app) => {
        const mergeResult = await OrAppsFn.merge(ctx, { app })
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
  args: { appTokens: v.array(v.object(OrAppTokenMetrics.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { appTokens }) => {
    const results = await Promise.all(
      appTokens.map(async (token) => {
        const mergeResult = await OrAppTokenMetricsFn.merge(ctx, { appTokenMetrics: token })
        return {
          identifier: `${token.app_id}`,
          action: mergeResult.action,
        }
      }),
    )
    return results
  },
})
