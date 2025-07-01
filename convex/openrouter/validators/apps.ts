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

const fields = {
  app_id: z4.number(),
  total_tokens: z4.coerce.number(),
}

export const AppStrictSchema = z4.strictObject({
  ...fields,
  app: z4.strictObject(appFields),
})

export const AppTransformSchema = z4
  .object({ ...fields, app: z4.object(appFields).transform(R.pickBy(R.isNonNullish)) })
  .transform((rec) => {
    const { created_at, id, ...app } = rec.app

    return {
      app: {
        ...app,
        app_id: id,
        or_created_at: new Date(created_at).getTime(),
      },

      appTokens: {
        app_id: rec.app_id,
        total_tokens: rec.total_tokens,
      },
    }
  })
