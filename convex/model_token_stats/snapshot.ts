import z4 from 'zod/v4'
import { orFetch } from '../openrouter/client'
import { validateRecord } from '../openrouter/validation'
import type { ModelTokenStats } from './table'
import { ModelTokenStatsStrictSchema, ModelTokenStatsTransformSchema } from './schemas'

export async function snapshot({ authorSlug }: { authorSlug: string }) {
  const result = await orFetch('/api/frontend/model-author', {
    params: {
      authorSlug,
    },
    schema: z4.object({
      data: z4.unknown(),
    }),
  })

  const { item, issues } = validateRecord(
    result.data,
    ModelTokenStatsTransformSchema,
    ModelTokenStatsStrictSchema,
  )

  const modelTokens: ModelTokenStats[] = item || []

  return { modelTokens, issues }
}
