import z4 from 'zod/v4'
import * as R from 'remeda'

const fields = {
  id: z4.string(),
  slug: z4.string(),
  name: z4.string(),
  description: z4.string().nullable(),
  created_at: z4.string(),
  updated_at: z4.string(),
  icon_uri: z4.null(),
}

export const AuthorStrictSchema = z4.strictObject({
  author: z4.strictObject(fields),
  modelsWithStats: z4.unknown(), // checked in model_token_stats
})

export const AuthorTransformSchema = z4
  .object({
    author: z4.object(fields),
  })
  .transform((rec) => rec.author)
  .transform(R.pickBy(R.isNonNullish))
  .transform((rec) => {
    const { id, created_at, updated_at, ...rest } = rec

    return {
      ...rest,
      uuid: id,
      origin_created_at: new Date(created_at).getTime(),
      origin_updated_at: new Date(updated_at).getTime(),
    }
  })
