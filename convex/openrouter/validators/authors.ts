import * as R from 'remeda'
import z4 from 'zod/v4'

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
  .transform((data) => data.author)
  .transform(R.pickBy(R.isNonNullish))
  .transform((data) => {
    const { id, created_at, updated_at, ...rest } = data

    return {
      ...rest,
      uuid: id,
      or_created_at: new Date(created_at).getTime(),
      or_updated_at: new Date(updated_at).getTime(),
    }
  })
