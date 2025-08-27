import * as R from 'remeda'
import { z } from 'zod'

export const apps = z
  .object({
    app_id: z.number(),
    total_tokens: z.coerce.number(),
    app: z
      .object({
        id: z.number(),
        title: z.string().nullable(),
        description: z.string().nullable(),
        main_url: z.string().nullable(),
        origin_url: z.string(),
        source_code_url: z.string().nullable(),
        created_at: z.string(),
      })
      .transform(R.pickBy(R.isNonNullish)),
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
