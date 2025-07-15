import { internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import { storeSnapshotData } from '../archive'
import { OrEndpoints } from '../entities/endpoints'
import { type EndpointStat } from '../entities/endpointStats'
import { OrModels } from '../entities/models'
import { validateArray, validateRecord, type Issue } from '../validation'
import { EndpointStrictSchema, EndpointTransformSchema } from '../validators/endpoints'
import {
  EndpointUptimeStrictSchema,
  EndpointUptimeTransformSchema,
} from '../validators/endpointUptimesMetrics'

type NewEndpointStat = {
  endpoint_uuid: string
  snapshot_at: number
  stat: EndpointStat
}

type NewEndpointUptime = {
  endpoint_uuid: string
  snapshot_at: number
  latest_72h: {
    timestamp: number
    uptime?: number
  }[]
}
export async function endpointsPipeline(
  ctx: ActionCtx,
  {
    snapshot_at,
    run_id,
    models,
    source,
  }: {
    snapshot_at: number
    run_id: string
    models: (typeof OrModels.$content)[]
    source: {
      endpoints: (args: { permaslug: string; variant: string }) => Promise<unknown[]>
      endpointUptimes: (args: { uuid: string }) => Promise<unknown>
    }
  },
) {
  const started_at = Date.now()
  const endpoints: (typeof OrEndpoints.$content)[] = []
  const endpointStats: NewEndpointStat[] = []
  const endpointUptimes: NewEndpointUptime[] = []
  const issues: Issue[] = []
  const rawEndpointResponses: [string, unknown][] = []

  for (const model of models) {
    for (const variant of model.variants) {
      const { permaslug } = model

      const data = await source.endpoints({ permaslug, variant })

      // Collect raw response for batched archival
      rawEndpointResponses.push([`${model.slug}:${variant}`, data])

      const { items, issues: validationIssues } = validateArray(
        data,
        EndpointTransformSchema,
        EndpointStrictSchema,
      )

      issues.push(...validationIssues)

      for (const endpoint of items) {
        // Fetch uptime data for this endpoint
        const uptimeData = await source.endpointUptimes({ uuid: endpoint.uuid })

        const { item: uptimeHistory, issues: uptimeValidationIssues } = validateRecord(
          uptimeData,
          EndpointUptimeTransformSchema,
          EndpointUptimeStrictSchema,
        )

        issues.push(...uptimeValidationIssues)

        // Calculate uptime average
        const validUptimes =
          uptimeHistory?.filter((u) => u.uptime !== undefined && u.uptime !== null) ?? []
        const uptime_average =
          validUptimes.length > 0
            ? validUptimes.reduce((sum, u) => sum + u.uptime!, 0) / validUptimes.length
            : undefined

        // Collect rolling window uptime data
        if (uptimeHistory) {
          endpointUptimes.push({
            endpoint_uuid: endpoint.uuid,
            snapshot_at,
            latest_72h: uptimeHistory.map((uptime) => ({
              timestamp: uptime.timestamp,
              uptime: uptime.uptime,
            })),
          })
        }

        endpoints.push({
          ...endpoint,
          model_slug: model.slug,
          model_permaslug: model.permaslug,
          capabilities: {
            ...endpoint.capabilities,
            image_input: model.input_modalities.includes('image'),
            file_input: model.input_modalities.includes('file'),
          },
          or_model_created_at: model.or_created_at,
          uptime_average,
          snapshot_at,
        })

        endpointStats.push({
          endpoint_uuid: endpoint.uuid,
          snapshot_at,
          stat: {
            ...endpoint.stats,
            timestamp: snapshot_at,
          },
        })
      }
    }
  }

  // Store batched endpoint responses
  await storeSnapshotData(ctx, {
    run_id,
    snapshot_at,
    type: 'endpoints',
    data: rawEndpointResponses,
  })

  const endpointUptimesResults = await ctx.runMutation(
    internal.openrouter.entities.endpointUptimes.upsert,
    {
      items: endpointUptimes,
    },
  )

  const endpointStatsResults = await ctx.runMutation(
    internal.openrouter.entities.endpointStats.upsert,
    {
      items: endpointStats,
    },
  )

  const endpointResults = await ctx.runMutation(internal.openrouter.entities.endpoints.upsert, {
    items: endpoints,
  })

  return {
    data: undefined,
    metrics: {
      entities: [endpointUptimesResults, endpointStatsResults, endpointResults],
      issues,
      started_at,
      ended_at: Date.now(),
    },
  }
}
