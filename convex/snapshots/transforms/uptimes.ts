import * as R from 'remeda'
import { z } from 'zod'

export const uptimes = z
  .object({
    history: z
      .object({
        date: z.string().transform((date) => new Date(date).getTime()),
        uptime: z.number().nullable(),
      })
      .transform(R.pickBy(R.isNonNullish))
      .array(),
  })
  .transform(({ history }) =>
    history.map((item) => ({
      timestamp: item.date,
      uptime: item.uptime,
    })),
  )
