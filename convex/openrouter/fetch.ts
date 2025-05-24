import { up } from 'up-fetch'
import { z } from 'zod'

const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.number(),
    message: z.string(),
  }),
})

const orClientBase = up(fetch, () => ({
  baseUrl: 'https://openrouter.ai',
  retry: {
    attempts: 3,
    delay: (ctx) => ctx.attempt ** 2 * 1000,
  },
  schema: z
    .object({
      data: z.unknown(),
    })
    .or(ErrorResponseSchema),
}))

export const orClient = {
  v1: {
    models: async () =>
      await orClientBase('/api/v1/models', {
        schema: z
          .object({
            data: z.array(
              z
                .object({
                  id: z.string(),
                  name: z.string(),
                })
                .passthrough(),
            ),
          })
          .or(ErrorResponseSchema),
      }),
  },

  frontend: {
    models: async () =>
      await orClientBase('/api/frontend/models', {
        schema: z
          .object({
            data: z.array(
              z
                .object({
                  name: z.string(),
                  permaslug: z.string(),
                  endpoint: z
                    .object({
                      id: z.string(),
                    })
                    .nullable(),
                })
                .passthrough(),
            ),
          })
          .or(ErrorResponseSchema),
      }),

    stats: {
      endpoints: async (params: { permaslug: string; variant: string }) =>
        await orClientBase('/api/frontend/stats/endpoint', {
          schema: z
            .object({
              data: z.array(
                z
                  .object({
                    id: z.string(),
                    model: z.object({}),
                    provider_info: z.object({}),
                  })
                  .passthrough(),
              ),
            })
            .or(ErrorResponseSchema),
          params,
        }),

      app: async ({
        permaslug,
        variant,
        limit = 20,
      }: {
        permaslug: string
        variant: string
        limit?: number
      }) =>
        await orClientBase('/api/frontend/stats/app', {
          schema: z.object({ data: z.array(z.record(z.string(), z.unknown())) }).or(ErrorResponseSchema),
          params: { permaslug, variant, limit },
        }),

      uptimeHourly: async (params: { id: string }) =>
        await orClientBase('/api/frontend/stats/uptime-hourly', {
          schema: z
            .object({
              data: z.object({
                history: z.array(z.unknown()),
              }),
            })
            .or(ErrorResponseSchema),
          params,
        }),
    },
  },
}
