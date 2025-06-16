import z4 from 'zod/v4'
import type { ModelView } from '../model_views/table'
import { orFetch } from '../openrouter/client'
import { validateArray } from '../openrouter/validation'
import { EndpointStrictSchema, EndpointTransformSchema } from './schemas'
import type { EndpointView } from './table'
import type { EndpointStat } from '../endpoint_stats/table'

export async function snapshot({ model }: { model: ModelView }) {
  const results: unknown[] = []

  for (const variant of model.variants) {
    const result = await orFetch('/api/frontend/stats/endpoint', {
      params: {
        permaslug: model.permaslug,
        variant,
      },
      schema: z4.object({
        data: z4.unknown().array(),
      }),
    })
    results.push(...result.data)
  }

  const { items, issues } = validateArray(
    results,
    EndpointTransformSchema,
    EndpointStrictSchema,
    (parsed) => ({
      endpoint: {
        ...parsed.endpoint,
        model_slug: model.slug,
        model_permaslug: model.permaslug,
        capabilities: {
          ...parsed.endpoint.capabilities,
          image_input: model.input_modalities.includes('image'),
          file_input: model.input_modalities.includes('file'),
        },
        origin_model_created_at: model.origin_created_at,
        origin_model_updated_at: model.origin_updated_at,
        epoch: model.epoch,
      },
      stats: {
        ...parsed.stats,
        epoch: model.epoch,
      },
    }),
  )

  const endpoints: EndpointView[] = []
  const stats: EndpointStat[] = []

  for (const item of items) {
    endpoints.push(item.endpoint)
    stats.push(item.stats)
  }

  return { endpoints, stats, issues }
}
