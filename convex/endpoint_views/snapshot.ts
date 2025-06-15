import z4 from 'zod/v4'
import type { ModelView } from '../model_views/table'
import { orFetch } from '../openrouter/client'
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

  const endpoints: EndpointView[] = []
  const stats: EndpointStat[] = []

  const transform: { index: number; error: z4.ZodError; ref?: string }[] = []
  const strict: { index: number; error: z4.ZodError; ref?: string }[] = []

  for (const [index, d] of results.entries()) {
    const r1 = EndpointTransformSchema.safeParse(d)
    if (r1.success) {
      endpoints.push({
        ...r1.data.endpoint,
        model_slug: model.slug,
        model_permaslug: model.permaslug,
        capabilities: {
          ...r1.data.endpoint.capabilities,
          image_input: model.input_modalities.includes('image'),
          file_input: model.input_modalities.includes('file'),
        },
        origin_model_created_at: model.origin_created_at,
        origin_model_updated_at: model.origin_updated_at,
        epoch: model.epoch,
      })

      stats.push({
        ...r1.data.stats,
        epoch: model.epoch,
      })
    } else {
      transform.push({ index, error: r1.error, ref: (d as any)?.permaslug })
    }

    const r2 = EndpointStrictSchema.safeParse(d)
    if (!r2.success) {
      strict.push({ index, error: r2.error, ref: (d as any)?.permaslug })
    }
  }

  return { endpoints, stats, issues: { transform, strict } }
}
