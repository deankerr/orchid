import * as R from 'remeda'
import z4 from 'zod/v4'

const appFields = {
  id: z4.number(),
  title: z4.string().nullable(),
  description: z4.string().nullable(),
  main_url: z4.string().nullable(),
  origin_url: z4.string(),
  source_code_url: z4.string().nullable(),
  created_at: z4.string(),
}

export const AppStrictSchema = z4.strictObject({
  app_id: z4.number(),
  total_tokens: z4.coerce.number(),
  app: z4.strictObject(appFields),
})

export const AppTransformSchema = z4
  .object({
    app_id: z4.number(),
    total_tokens: z4.coerce.number(),
    app: z4.object(appFields).transform(R.pickBy(R.isNonNullish)),
  })
  .transform((data) => {
    const { created_at, id, ...app } = data.app

    return {
      app: {
        ...app,
        app_id: id,
        or_created_at: new Date(created_at).getTime(),
      },

      appTokens: {
        app_id: data.app_id,
        total_tokens: data.total_tokens,
      },
    }
  })
