import z4 from 'zod/v4'
import { orFetch } from '../openrouter/client'
import type { ModelTokenStats } from './table'
import { ModelTokenStatsStrictSchema, ModelTokenStatsTransformSchema } from './schemas'

export async function snapshot({ authorSlug }: { authorSlug: string }) {
  const result = await orFetch('/api/frontend/modelAuthor', {
    params: {
      authorSlug,
    },
    schema: z4.object({
      data: z4.unknown(),
    }),
  })

  const modelTokens: ModelTokenStats[] = []
  const transform: { index: number; error: z4.ZodError }[] = []
  const strict: { index: number; error: z4.ZodError }[] = []

  const r1 = ModelTokenStatsTransformSchema.safeParse(result.data)
  if (r1.success) {
    modelTokens.push(...r1.data)
  } else {
    transform.push({ index: 0, error: r1.error })
  }

  const r2 = ModelTokenStatsStrictSchema.safeParse(result.data)
  if (!r2.success) {
    strict.push({ index: 0, error: r2.error })
  }

  return { modelTokens, issues: { transform, strict } }
}
