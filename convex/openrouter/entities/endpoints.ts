import z4 from 'zod/v4'
import { v } from 'convex/values'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import { internal } from '../../_generated/api'
import { orFetch } from '../client'
import { EndpointViewFn, EndpointViews, type EndpointView } from '../../endpoint_views/table'
import { EndpointStatsFn, EndpointStats, type EndpointStat } from '../../endpoint_stats/table'
import { EndpointUptimeStatsFn, EndpointUptimeStats } from '../../endpoint_uptime_stats/table'
import { EndpointStrictSchema, EndpointTransformSchema } from '../../endpoint_views/schemas'
import {
  EndpointUptimeStrictSchema,
  EndpointUptimeTransformSchema,
} from '../../endpoint_uptime_stats/schemas'
import { validateArray } from '../validation'
import type { EntitySyncData, SyncConfig, MergeResult } from '../types'
import { storeJSON } from '../../files'
import type { ModelView } from '../../model_views/table'

// Batch size for large arrays to avoid Convex limits
const ENDPOINT_UPTIME_BATCH_SIZE = 5000

/**
 * Sync endpoints and related data for given models
 */
export async function syncEndpoints(
  ctx: ActionCtx,
  config: SyncConfig,
  models: ModelView[],
): Promise<{
  endpoints: EntitySyncData<EndpointView>
  endpointStats: EntitySyncData<EndpointStat>
  endpointUptimes: EntitySyncData<EndpointUptimeStats>
}> {
  const allEndpoints: EndpointView[] = []
  const allEndpointStats: EndpointStat[] = []
  const allEndpointUptimes: EndpointUptimeStats[] = []
  const allValidationIssues: any[] = []
  const errorMergeResults: MergeResult[] = []

  console.log(`Processing endpoints for ${models.length} models...`)

  for (const model of models) {
    try {
      // Sync endpoints and stats for each model variant
      for (const variant of model.variants) {
        const endpointData = await syncModelEndpoints(ctx, config, model, variant)
        allEndpoints.push(...endpointData.endpoints)
        allEndpointStats.push(...endpointData.endpointStats)
        allValidationIssues.push(...endpointData.validationIssues)

        // Sync uptime data for each endpoint
        for (const endpoint of endpointData.endpoints) {
          const uptimeData = await syncEndpointUptimes(ctx, config, endpoint.uuid)
          allEndpointUptimes.push(...uptimeData.uptimes)
          allValidationIssues.push(...uptimeData.validationIssues)
        }
      }
    } catch (error) {
      errorMergeResults.push({
        identifier: model.slug,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown endpoint processing error',
      })
    }
  }

  try {
    // Merge all data and track results separately
    const endpointMergeResults = await ctx.runMutation(
      internal.openrouter.entities.endpoints.mergeEndpoints,
      {
        endpoints: allEndpoints,
      },
    )

    const statsMergeResults = await ctx.runMutation(
      internal.openrouter.entities.endpoints.mergeEndpointStats,
      {
        endpointStats: allEndpointStats,
      },
    )

    // Merge endpoint uptimes in batches to avoid Convex array limits
    console.log(`Batching ${allEndpointUptimes.length} endpoint uptimes...`)
    const uptimeMergeResults: MergeResult[] = []

    for (let i = 0; i < allEndpointUptimes.length; i += ENDPOINT_UPTIME_BATCH_SIZE) {
      const batch = allEndpointUptimes.slice(i, i + ENDPOINT_UPTIME_BATCH_SIZE)
      console.log(
        `Processing endpoint uptime batch ${Math.floor(i / ENDPOINT_UPTIME_BATCH_SIZE) + 1} (${batch.length} items)`,
      )

      const batchResults = await ctx.runMutation(
        internal.openrouter.entities.endpoints.mergeEndpointUptimes,
        {
          endpointUptimes: batch,
        },
      )
      uptimeMergeResults.push(...batchResults)
    }

    return {
      endpoints: {
        items: allEndpoints,
        validationIssues: allValidationIssues.filter(
          (i) => i.type !== 'fetch_error' || i.endpoint_uuid === undefined,
        ),
        mergeResults: endpointMergeResults,
      },
      endpointStats: {
        items: allEndpointStats,
        validationIssues: [],
        mergeResults: statsMergeResults,
      },
      endpointUptimes: {
        items: allEndpointUptimes,
        validationIssues: allValidationIssues.filter((i) => i.endpoint_uuid !== undefined),
        mergeResults: uptimeMergeResults,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during endpoints merge'
    return {
      endpoints: {
        items: [],
        validationIssues: allValidationIssues,
        mergeResults: errorMergeResults,
        fetchError: errorMessage,
      },
      endpointStats: {
        items: [],
        validationIssues: [],
        mergeResults: [],
      },
      endpointUptimes: {
        items: [],
        validationIssues: [],
        mergeResults: [],
      },
    }
  }
}

// Helper functions
async function syncModelEndpoints(
  ctx: ActionCtx,
  config: SyncConfig,
  model: ModelView,
  variant: string,
): Promise<{ endpoints: EndpointView[]; endpointStats: EndpointStat[]; validationIssues: any[] }> {
  try {
    const response = await orFetch('/api/frontend/stats/endpoint', {
      params: { permaslug: model.permaslug, variant },
      schema: z4.object({ data: z4.unknown().array() }),
    })

    // Store raw response
    const snapshotKey = `openrouter-endpoints-${model.slug}-${variant}-snapshot-${config.snapshotStartTime}`
    await storeJSON(ctx, {
      key: snapshotKey,
      epoch: config.epoch,
      compress: config.compress,
      data: response,
    })

    const { items, issues } = validateArray(response.data, EndpointTransformSchema, EndpointStrictSchema)

    const endpoints: EndpointView[] = []
    const endpointStats: EndpointStat[] = []

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
        origin_model_created_at: model.origin_created_at,
        origin_model_updated_at: model.origin_updated_at,
        epoch: config.epoch,
      })
      endpointStats.push({
        ...item.stats,
        epoch: config.epoch,
      })
    }

    return { endpoints, endpointStats, validationIssues: issues }
  } catch (error) {
    return {
      endpoints: [],
      endpointStats: [],
      validationIssues: [
        {
          type: 'fetch_error',
          message: error instanceof Error ? error.message : 'Unknown endpoint fetch error',
          model: model.slug,
          variant,
        },
      ],
    }
  }
}

async function syncEndpointUptimes(
  ctx: ActionCtx,
  config: SyncConfig,
  endpointUuid: string,
): Promise<{ uptimes: EndpointUptimeStats[]; validationIssues: any[] }> {
  try {
    const response = await orFetch('/api/frontend/stats/uptime-hourly', {
      params: { id: endpointUuid },
      schema: z4.object({ data: z4.unknown() }),
    })

    const { items, issues } = validateArray(
      [response.data],
      EndpointUptimeTransformSchema,
      EndpointUptimeStrictSchema,
    )

    const uptimes =
      items[0]?.map((uptime: any) => ({
        endpoint_uuid: endpointUuid,
        timestamp: uptime.timestamp,
        uptime: uptime.uptime,
      })) || []

    return { uptimes, validationIssues: issues }
  } catch (error) {
    return {
      uptimes: [],
      validationIssues: [
        {
          type: 'fetch_error',
          message: error instanceof Error ? error.message : 'Unknown uptime fetch error',
          endpoint_uuid: endpointUuid,
        },
      ],
    }
  }
}

// Merge mutations
export const mergeEndpoints = internalMutation({
  args: { endpoints: v.array(v.object(EndpointViews.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { endpoints }) => {
    const results: MergeResult[] = []
    for (const endpoint of endpoints) {
      try {
        const mergeResult = await EndpointViewFn.merge(ctx, { endpoint })
        results.push({
          identifier: endpoint.uuid,
          action: mergeResult.action,
          docId: mergeResult.docId,
          changes: mergeResult.changes,
        })
      } catch (error) {
        results.push({
          identifier: endpoint.uuid,
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown endpoint merge error',
        })
      }
    }
    return results
  },
})

export const mergeEndpointStats = internalMutation({
  args: { endpointStats: v.array(v.object(EndpointStats.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { endpointStats }) => {
    const results: MergeResult[] = []
    for (const stat of endpointStats) {
      try {
        const mergeResult = await EndpointStatsFn.merge(ctx, { endpointStats: stat })
        results.push({
          identifier: stat.endpoint_uuid,
          action: mergeResult.action,
          docId: mergeResult.docId,
          changes: mergeResult.changes,
        })
      } catch (error) {
        results.push({
          identifier: stat.endpoint_uuid,
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown stat merge error',
        })
      }
    }
    return results
  },
})

export const mergeEndpointUptimes = internalMutation({
  args: { endpointUptimes: v.array(v.object(EndpointUptimeStats.withoutSystemFields)) },
  handler: async (ctx: MutationCtx, { endpointUptimes }) => {
    try {
      const results = await EndpointUptimeStatsFn.mergeTimeSeries(ctx, {
        endpointUptimesSeries: endpointUptimes,
      })
      return results.map((result) => ({
        identifier: result.action,
        action: result.action,
        docId: result.docId,
        changes: result.changes,
      }))
    } catch (error) {
      return [
        {
          identifier: 'all',
          action: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown endpoint uptime merge error',
        },
      ]
    }
  },
})
