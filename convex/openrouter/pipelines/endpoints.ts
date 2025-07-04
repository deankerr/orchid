import type { ActionCtx } from '../../_generated/server'
import { storeSnapshotData } from '../archive'
import { output } from '../output'
import type { Entities } from '../registry'
import { validateArray, validateRecord, type Issue } from '../validation'
import { EndpointStrictSchema, EndpointTransformSchema } from '../validators/endpoints'
import {
  EndpointUptimeStrictSchema,
  EndpointUptimeTransformSchema,
} from '../validators/endpointUptimesMetrics'

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
    models: (typeof Entities.models.table.$content)[]
    source: {
      endpoints: (args: { permaslug: string; variant: string }) => Promise<unknown[]>
      endpointUptimes: (args: { uuid: string }) => Promise<unknown>
    }
  },
) {
  const started_at = Date.now()
  const endpoints: (typeof Entities.endpoints.table.$content)[] = []
  const endpointMetrics: (typeof Entities.endpointMetrics.table.$content)[] = []
  const endpointUptimeMetrics: (typeof Entities.endpointUptimeMetrics.table.$content)[] = []
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

        // Collect uptime metrics
        if (uptimeHistory) {
          const uptimeMetrics = uptimeHistory.map((uptime) => ({
            endpoint_uuid: endpoint.uuid,
            timestamp: uptime.timestamp,
            uptime: uptime.uptime,
          }))
          endpointUptimeMetrics.push(...uptimeMetrics)
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

        if (endpoint.stats) {
          endpointMetrics.push({
            ...endpoint.stats,
            endpoint_uuid: endpoint.uuid,
            snapshot_at,
          })
        }
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

  const results = await output(ctx, {
    entities: [
      {
        name: 'endpoints',
        items: endpoints,
      },
      {
        name: 'endpointMetrics',
        items: endpointMetrics,
      },
      {
        name: 'endpointUptimeMetrics',
        items: endpointUptimeMetrics,
      },
    ],
  })

  return {
    data: undefined,
    metrics: {
      entities: results,
      issues,
      started_at,
      ended_at: Date.now(),
    },
  }
}
