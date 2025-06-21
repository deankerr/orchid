import { v } from 'convex/values'
import z4 from 'zod/v4'

import { internal } from '../../_generated/api'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import {
  OrAppTokenMetrics,
  OrAppTokenMetricsFn,
  type OrAppTokenMetricsFields,
} from '../../or/or_app_token_metrics'
import { OrApps, OrAppsFn, type OrAppFields } from '../../or/or_apps'
import { AppStrictSchema, AppTransformSchema } from '../../or/or_apps_validators'
import type { OrModelFields } from '../../or/or_models'
import { storeSnapshotData } from '../archives'
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
  appTokenMetrics: EntitySyncData<OrAppTokenMetricsFields>
}> {
  const appsMap = new Map<number, OrAppFields>()
  const allAppTokenMetrics: OrAppTokenMetricsFields[] = []
  const allIssues: Issue[] = []
  const rawAppResponses: Record<string, unknown> = {}

  console.log(`Processing apps for ${models.length} models...`)

  for (const model of models) {
    // Process each model variant
    for (const variant of model.variants) {
      const appData = await syncModelApps(ctx, config, model, variant)
      allAppTokenMetrics.push(...appData.appTokenMetrics)
      allIssues.push(...appData.issues)

      // Collect raw response for archival
      if (appData.rawResponse) {
        rawAppResponses[`${model.slug}-${variant}`] = appData.rawResponse
      }

      // Dedupe apps by app_id
      for (const app of appData.apps) {
        if (!appsMap.has(app.app_id)) {
          appsMap.set(app.app_id, app)
        }
      }
    }
  }

  // Store batched app responses
  if (Object.keys(rawAppResponses).length > 0) {
    await storeSnapshotData(ctx, {
      run_id: config.runId,
      snapshot_at: config.snapshotAt,
      type: 'apps',
      data: rawAppResponses,
    })
  }

  const apps = Array.from(appsMap.values())

  // Merge apps
  const appResults = await ctx.runMutation(internal.openrouter.entities.apps.mergeApps, {
    apps,
  })

  // Merge app token metrics in batches to avoid Convex limits and timeouts
  const appTokenMetricsResults = await processBatchMutation({
    ctx,
    items: allAppTokenMetrics,
    batchSize: APP_TOKEN_BATCH_SIZE,
    mutationRef: internal.openrouter.entities.apps.mergeAppTokenMetrics,
    mutationArgsKey: 'appTokenMetrics',
  })

  console.log('Apps complete')
  return {
    apps: {
      items: apps,
      issues: allIssues.filter((issue) => !issue.identifier.includes('token')),
      mergeResults: appResults,
    },
    appTokenMetrics: {
      items: allAppTokenMetrics,
      issues: allIssues.filter((issue) => issue.identifier.includes('token')),
      mergeResults: appTokenMetricsResults,
    },
  }
}

// Helper function
async function syncModelApps(
  ctx: ActionCtx,
  config: SyncConfig,
  model: OrModelFields,
  variant: string,
): Promise<{
  apps: OrAppFields[]
  appTokenMetrics: OrAppTokenMetricsFields[]
  issues: Issue[]
  rawResponse?: unknown
}> {
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
    const appTokenMetrics: OrAppTokenMetricsFields[] = []

    for (const item of items) {
      apps.push({
        ...item.app,
        snapshot_at: config.snapshotAt,
      })
      appTokenMetrics.push({
        ...item.appTokens,
        model_permaslug: model.permaslug,
        model_slug: model.slug,
        model_variant: variant,
        snapshot_at: config.snapshotAt,
      })
    }

    return { apps, appTokenMetrics, issues, rawResponse: response }
  } catch (error) {
    return {
      apps: [],
      appTokenMetrics: [],
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

export const mergeAppTokenMetrics = internalMutation({
  args: { appTokenMetrics: v.array(v.object(OrAppTokenMetrics.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { appTokenMetrics }) => {
    const results = await Promise.all(
      appTokenMetrics.map(async (token) => {
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
