import { v } from 'convex/values'
import z4 from 'zod/v4'
import { internal } from '../../_generated/api'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import {
  OrEndpointMetrics,
  OrEndpointMetricsFn,
  type OrEndpointMetricsFields,
} from '../../or/or_endpoint_metrics'
import {
  EndpointUptimeStrictSchema,
  EndpointUptimeTransformSchema,
} from '../../or/or_endpoint_uptime_metrics_validators'
import {
  OrEndpointUptimeMetrics,
  OrEndpointUptimeMetricsFn,
  type OrEndpointUptimeMetricsFields,
} from '../../or/or_endpoint_uptime_metrics'
import { EndpointStrictSchema, EndpointTransformSchema } from '../../or/or_endpoints_validators'
import { OrEndpointsFn, OrEndpoints, type OrEndpointFields } from '../../or/or_endpoints'
import { storeJSON } from '../../files'
import type { OrModelFields } from '../../or/or_models'
import { orFetch } from '../client'
import type { EntitySyncData, Issue, SyncConfig } from '../types'
import { processBatchMutation } from '../utils'
import { validateArray, validateRecord } from '../validation'

// Batch size for large arrays to avoid Convex limits
const ENDPOINT_UPTIME_BATCH_SIZE = 5000

/**
 * Sync endpoints and related data for given models
 */
export async function syncEndpoints(
  ctx: ActionCtx,
  config: SyncConfig,
  models: OrModelFields[],
): Promise<{
  endpoints: EntitySyncData<OrEndpointFields>
  endpointStats: EntitySyncData<OrEndpointMetricsFields>
  endpointUptimes: EntitySyncData<OrEndpointUptimeMetricsFields>
}> {
  const allEndpoints: OrEndpointFields[] = []
  const allEndpointStats: OrEndpointMetricsFields[] = []
  const allEndpointUptimes: OrEndpointUptimeMetricsFields[] = []
  const allIssues: Issue[] = []

  console.log(`Processing endpoints for ${models.length} models...`)

  for (const model of models) {
    // Sync endpoints and stats for each model variant
    for (const variant of model.variants) {
      const endpointData = await syncModelEndpoints(ctx, config, model, variant)
      allEndpoints.push(...endpointData.endpoints)
      allEndpointStats.push(...endpointData.endpointStats)
      allIssues.push(...endpointData.issues)

      // Sync uptime data for each endpoint
      for (const endpoint of endpointData.endpoints) {
        const uptimeData = await syncEndpointUptimes(ctx, config, endpoint.uuid)
        allEndpointUptimes.push(...uptimeData.uptimes)
        allIssues.push(...uptimeData.issues)
      }
    }
  }

  // Merge all data and track results separately
  const endpointMergeResults = await ctx.runMutation(internal.openrouter.entities.endpoints.mergeEndpoints, {
    endpoints: allEndpoints,
  })

  const statsMergeResults = await ctx.runMutation(internal.openrouter.entities.endpoints.mergeEndpointStats, {
    endpointStats: allEndpointStats,
  })

  // Merge endpoint uptimes in batches to avoid Convex array limits
  const uptimeMergeResults = await processBatchMutation({
    ctx,
    items: allEndpointUptimes,
    batchSize: ENDPOINT_UPTIME_BATCH_SIZE,
    mutationRef: internal.openrouter.entities.endpoints.mergeEndpointUptimes,
    mutationArgsKey: 'endpointUptimes',
  })

  console.log('Endpoints complete')
  return {
    endpoints: {
      items: allEndpoints,
      issues: allIssues.filter(
        (issue) => !issue.identifier.includes('stats') && !issue.identifier.includes('uptime'),
      ),
      mergeResults: endpointMergeResults,
    },
    endpointStats: {
      items: allEndpointStats,
      issues: allIssues.filter((issue) => issue.identifier.includes('stats')),
      mergeResults: statsMergeResults,
    },
    endpointUptimes: {
      items: allEndpointUptimes,
      issues: allIssues.filter((issue) => issue.identifier.includes('uptime')),
      mergeResults: uptimeMergeResults,
    },
  }
}

// Helper functions
async function syncModelEndpoints(
  ctx: ActionCtx,
  config: SyncConfig,
  model: OrModelFields,
  variant: string,
): Promise<{ endpoints: OrEndpointFields[]; endpointStats: OrEndpointMetricsFields[]; issues: Issue[] }> {
  const modelVariantId = `${model.slug}-${variant}`

  try {
    const response = await orFetch('/api/frontend/stats/endpoint', {
      params: { permaslug: model.permaslug, variant },
      schema: z4.object({ data: z4.unknown().array() }),
    })

    // Store raw response
    const snapshotKey = `openrouter-endpoints-${model.slug}-${variant}-snapshot-${config.startedAt}`
    await storeJSON(ctx, {
      key: snapshotKey,
      snapshot_at: config.snapshotAt,
      compress: config.compress,
      data: response,
    })

    const { items, issues: validationIssues } = validateArray(
      response.data,
      EndpointTransformSchema,
      EndpointStrictSchema,
    )

    // Convert validation issues to Issue format
    const issues: Issue[] = validationIssues.map((issue) => ({
      ...issue,
      identifier: `${modelVariantId}:${issue.index}`,
    }))

    const endpoints: OrEndpointFields[] = []
    const endpointStats: OrEndpointMetricsFields[] = []

    for (const item of items) {
      endpoints.push({
        ...item.endpoint,
        model_slug: model.slug,
        model_permaslug: model.permaslug,
        capabilities: {
          ...item.endpoint.capabilities,
          image_input: model.input_modalities.includes('image'),
          file_input: model.input_modalities.includes('file'),
        },
        or_model_created_at: model.or_created_at,
        snapshot_at: config.snapshotAt,
      })

      if (item.stats) {
        endpointStats.push({
          ...item.stats,
          snapshot_at: config.snapshotAt,
        })
      }
    }

    return { endpoints, endpointStats, issues }
  } catch (error) {
    return {
      endpoints: [],
      endpointStats: [],
      issues: [
        {
          type: 'sync',
          identifier: modelVariantId,
          message: error instanceof Error ? error.message : 'Unknown endpoint fetch error',
        },
      ],
    }
  }
}

async function syncEndpointUptimes(
  ctx: ActionCtx,
  config: SyncConfig,
  endpointUuid: string,
): Promise<{ uptimes: OrEndpointUptimeMetricsFields[]; issues: Issue[] }> {
  try {
    const response = await orFetch('/api/frontend/stats/uptime-hourly', {
      params: { id: endpointUuid },
      schema: z4.object({ data: z4.unknown() }),
    })

    const { item, issues: validationIssues } = validateRecord(
      response.data,
      EndpointUptimeTransformSchema,
      EndpointUptimeStrictSchema,
    )

    // Convert validation issues to Issue format
    const issues: Issue[] = validationIssues.map((issue) => ({
      ...issue,
      identifier: `uptime-${endpointUuid}`,
    }))

    const uptimes = item.map((uptime) => ({
      endpoint_uuid: endpointUuid,
      timestamp: uptime.timestamp,
      uptime: uptime.uptime,
    }))

    return { uptimes, issues }
  } catch (error) {
    return {
      uptimes: [],
      issues: [
        {
          type: 'sync',
          identifier: `uptime-${endpointUuid}`,
          message: error instanceof Error ? error.message : 'Unknown uptime fetch error',
        },
      ],
    }
  }
}

// Merge mutations
export const mergeEndpoints = internalMutation({
  args: { endpoints: v.array(v.object(OrEndpoints.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { endpoints }) => {
    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        const mergeResult = await OrEndpointsFn.merge(ctx, { endpoint })
        return {
          identifier: endpoint.uuid,
          action: mergeResult.action,
        }
      }),
    )
    return results
  },
})

export const mergeEndpointStats = internalMutation({
  args: { endpointStats: v.array(v.object(OrEndpointMetrics.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { endpointStats }) => {
    const results = await Promise.all(
      endpointStats.map(async (stat) => {
        const mergeResult = await OrEndpointMetricsFn.merge(ctx, { endpointMetrics: stat })
        return {
          identifier: stat.endpoint_uuid,
          action: mergeResult.action,
        }
      }),
    )
    return results
  },
})

export const mergeEndpointUptimes = internalMutation({
  args: { endpointUptimes: v.array(v.object(OrEndpointUptimeMetrics.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { endpointUptimes }) => {
    const results = await OrEndpointUptimeMetricsFn.mergeTimeSeries(ctx, {
      endpointUptimesSeries: endpointUptimes,
    })
    return results.map((result) => ({
      identifier: result.action,
      action: result.action,
    }))
  },
})
