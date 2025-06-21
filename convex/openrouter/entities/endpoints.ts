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
  OrEndpointUptimeMetrics,
  OrEndpointUptimeMetricsFn,
  type OrEndpointUptimeMetricsFields,
} from '../../or/or_endpoint_uptime_metrics'
import {
  EndpointUptimeStrictSchema,
  EndpointUptimeTransformSchema,
} from '../../or/or_endpoint_uptime_metrics_validators'
import { OrEndpoints, OrEndpointsFn, type OrEndpointFields } from '../../or/or_endpoints'
import { EndpointStrictSchema, EndpointTransformSchema } from '../../or/or_endpoints_validators'
import type { OrModelFields } from '../../or/or_models'
import { storeSnapshotData } from '../archives'
import { orFetch } from '../client'
import type { EntitySyncData, Issue, SyncConfig } from '../types'
import { processBatchMutation } from '../utils'
import { validateArray, validateRecord } from '../validation'

// Batch size for large arrays to avoid Convex limits
const ENDPOINT_UPTIME_BATCH_SIZE = 4000

/**
 * Sync endpoints and related data for given models
 */
export async function syncEndpoints(
  ctx: ActionCtx,
  config: SyncConfig,
  models: OrModelFields[],
): Promise<{
  endpoints: EntitySyncData<OrEndpointFields>
  endpointMetrics: EntitySyncData<OrEndpointMetricsFields>
  endpointUptimeMetrics: EntitySyncData<OrEndpointUptimeMetricsFields>
}> {
  const allEndpoints: OrEndpointFields[] = []
  const allEndpointMetrics: OrEndpointMetricsFields[] = []
  const allEndpointUptimeMetrics: OrEndpointUptimeMetricsFields[] = []
  const allIssues: Issue[] = []
  const rawEndpointResponses: [string, unknown][] = []

  console.log(`Processing endpoints for ${models.length} models...`)

  for (const model of models) {
    // Sync endpoints and stats for each model variant
    for (const variant of model.variants) {
      const endpointData = await syncModelEndpoints(ctx, config, model, variant)
      allEndpoints.push(...endpointData.endpoints)
      allEndpointMetrics.push(...endpointData.endpointMetrics)
      allIssues.push(...endpointData.issues)

      // Collect raw response for archival
      if (endpointData.rawResponse) {
        rawEndpointResponses.push([`${model.slug}:${variant}`, endpointData.rawResponse])
      }

      // Sync uptime data for each endpoint (but don't archive - low value)
      for (const endpoint of endpointData.endpoints) {
        const uptimeData = await syncEndpointUptimes(ctx, config, endpoint.uuid)
        allEndpointUptimeMetrics.push(...uptimeData.uptimeMetrics)
        allIssues.push(...uptimeData.issues)
      }
    }
  }

  // Store batched endpoint responses
  await storeSnapshotData(ctx, {
    run_id: config.runId,
    snapshot_at: config.snapshotAt,
    type: 'endpoints',
    data: rawEndpointResponses,
  })

  // Merge all data and track results separately
  const endpointMergeResults = await ctx.runMutation(
    internal.openrouter.entities.endpoints.mergeEndpoints,
    {
      endpoints: allEndpoints,
    },
  )

  const metricsMergeResults = await ctx.runMutation(
    internal.openrouter.entities.endpoints.mergeEndpointMetrics,
    {
      endpointMetrics: allEndpointMetrics,
    },
  )

  // Merge endpoint uptime metrics in batches to avoid Convex array limits
  const uptimeMetricsMergeResults = await processBatchMutation({
    ctx,
    items: allEndpointUptimeMetrics,
    batchSize: ENDPOINT_UPTIME_BATCH_SIZE,
    mutationRef: internal.openrouter.entities.endpoints.mergeEndpointUptimeMetrics,
    mutationArgsKey: 'endpointUptimeMetrics',
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
    endpointMetrics: {
      items: allEndpointMetrics,
      issues: allIssues.filter((issue) => issue.identifier.includes('stats')),
      mergeResults: metricsMergeResults,
    },
    endpointUptimeMetrics: {
      items: allEndpointUptimeMetrics,
      issues: allIssues.filter((issue) => issue.identifier.includes('uptime')),
      mergeResults: uptimeMetricsMergeResults,
    },
  }
}

// Helper functions
async function syncModelEndpoints(
  ctx: ActionCtx,
  config: SyncConfig,
  model: OrModelFields,
  variant: string,
): Promise<{
  endpoints: OrEndpointFields[]
  endpointMetrics: OrEndpointMetricsFields[]
  issues: Issue[]
  rawResponse?: unknown
}> {
  const modelVariantId = `${model.slug}-${variant}`

  try {
    const response = await orFetch('/api/frontend/stats/endpoint', {
      params: { permaslug: model.permaslug, variant },
      schema: z4.object({ data: z4.unknown().array() }),
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
    const endpointMetrics: OrEndpointMetricsFields[] = []

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
        endpointMetrics.push({
          ...item.stats,
          snapshot_at: config.snapshotAt,
        })
      }
    }

    return { endpoints, endpointMetrics, issues, rawResponse: response }
  } catch (error) {
    return {
      endpoints: [],
      endpointMetrics: [],
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
): Promise<{ uptimeMetrics: OrEndpointUptimeMetricsFields[]; issues: Issue[] }> {
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

    const uptimeMetrics = item.map((uptime) => ({
      endpoint_uuid: endpointUuid,
      timestamp: uptime.timestamp,
      uptime: uptime.uptime,
    }))

    return { uptimeMetrics, issues }
  } catch (error) {
    return {
      uptimeMetrics: [],
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

export const mergeEndpointMetrics = internalMutation({
  args: { endpointMetrics: v.array(v.object(OrEndpointMetrics.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { endpointMetrics }) => {
    const results = await Promise.all(
      endpointMetrics.map(async (metric) => {
        const mergeResult = await OrEndpointMetricsFn.merge(ctx, { endpointMetrics: metric })
        return {
          identifier: metric.endpoint_uuid,
          action: mergeResult.action,
        }
      }),
    )
    return results
  },
})

export const mergeEndpointUptimeMetrics = internalMutation({
  args: { endpointUptimeMetrics: v.array(v.object(OrEndpointUptimeMetrics.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { endpointUptimeMetrics }) => {
    const results = await OrEndpointUptimeMetricsFn.mergeTimeSeries(ctx, {
      endpointUptimesSeries: endpointUptimeMetrics,
    })
    return results.map((result) => ({
      identifier: result.action,
      action: result.action,
    }))
  },
})
