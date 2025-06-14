import z4 from 'zod/v4'

export const EndpointUptimeStrictSchema = z4.strictObject({
  history: z4
    .strictObject({
      date: z4.string(),
      uptime: z4.number().nullable(),
    })
    .array(),
})

export const EndpointUptimeTransformSchema = z4
  .object({
    history: z4
      .object({
        date: z4.string(),
        uptime: z4.number().nullable(),
      })
      .array(),
  })
  .transform((rec) => rec.history)
  .transform((history) =>
    history.map((item) => ({
      timestamp: new Date(item.date).getTime(),
      uptime: item.uptime,
    })),
  )
