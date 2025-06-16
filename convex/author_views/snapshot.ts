import z4 from 'zod/v4'
import { orFetch } from '../openrouter/client'
import { validateRecord } from '../openrouter/validation'
import type { AuthorView } from './table'
import { AuthorStrictSchema, AuthorTransformSchema } from './schemas'

export async function snapshot({ authorSlug, epoch }: { authorSlug: string; epoch: number }) {
  const result = await orFetch('/api/frontend/model-author', {
    params: {
      authorSlug,
      shouldIncludeStats: true,
      shouldIncludeVariants: false,
    },
    schema: z4.object({
      data: z4.unknown(),
    }),
  })

  const { item, issues } = validateRecord(
    result.data,
    AuthorTransformSchema,
    AuthorStrictSchema,
    (parsed) => ({
      ...parsed,
      epoch,
    }),
  )

  const authors: AuthorView[] = item ? [item] : []

  return { authors, issues }
}
