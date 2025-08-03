import * as R from 'remeda'
import z4 from 'zod/v4'

import { orFetch } from '../../openrouter/sources'

export const transformSchema = z4
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

export const uptimes = {
  key: 'uptimes',
  schema: transformSchema,
  remote: async (params: { uuid: string }) => {
    return await orFetch('/api/frontend/stats/uptime-hourly', { params: { id: params.uuid } })
  },
  archiveKey: (params: { uuid: string }) => {
    return { type: 'uptimes', params: params.uuid }
  },
}
