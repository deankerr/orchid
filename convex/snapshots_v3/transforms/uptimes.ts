import * as R from 'remeda'
import z4 from 'zod/v4'

export const uptimes = z4
  .object({
    history: z4
      .object({
        date: z4.string().transform((date) => new Date(date).getTime()),
        uptime: z4.number().nullable(),
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
