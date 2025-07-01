import { internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import { storeSnapshotData } from '../archive'
import { output } from '../output'
import type { Entities } from '../registry'
import { validateArray, type Issue } from '../validation'
import { EndpointStrictSchema, EndpointTransformSchema } from '../validators/endpoints'

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
    }
  },
) {
  const endpoints: (typeof Entities.endpoints.table.$content)[] = []
  const endpointMetrics: (typeof Entities.endpointMetrics.table.$content)[] = []
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
          snapshot_at,
        })

        if (item.stats) {
          endpointMetrics.push({
            ...item.stats,
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
    ],
  })

  await ctx.runMutation(internal.openrouter.snapshot.insertResult, {
    snapshot_at,
    run_id,
    pipeline: 'endpoints',
    results,
    issues,
  })

  return endpoints
}
