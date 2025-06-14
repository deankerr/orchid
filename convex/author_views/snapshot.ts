import z4 from 'zod/v4'
import { orFetch } from '../openrouter/client'
import type { AuthorView } from './table'
import { AuthorStrictSchema, AuthorTransformSchema } from './schemas'

export async function snapshot({ authorSlug, epoch }: { authorSlug: string; epoch: number }) {
  const result = await orFetch('/api/frontend/modelAuthor', {
    params: {
      authorSlug,
    },
    schema: z4.object({
      data: z4.unknown(),
    }),
  })

  const authors: AuthorView[] = []
  const transform: { index: number; error: z4.ZodError }[] = []
  const strict: { index: number; error: z4.ZodError }[] = []

  const r1 = AuthorTransformSchema.safeParse(result.data)
  if (r1.success) {
    authors.push({
      ...r1.data,
      epoch,
    })
  } else {
    transform.push({ index: 0, error: r1.error })
  }

  const r2 = AuthorStrictSchema.safeParse(result.data)
  if (!r2.success) {
    strict.push({ index: 0, error: r2.error })
  }

  return { authors, issues: { transform, strict } }
}
