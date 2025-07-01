import z4 from 'zod/v4'

import { up } from 'up-fetch'

export const orFetch = up(fetch, () => ({
  baseUrl: 'https://openrouter.ai',
  retry: {
    attempts: 2,
    delay: (ctx) => ctx.attempt ** 2 * 1000,
  },
}))

export const OpenRouter = {
  fetch: {
    apps: async ({ permaslug, variant }: { permaslug: string; variant: string }) => {
      const response = await orFetch('/api/frontend/stats/app', {
        params: { permaslug, variant, limit: 20 },
        schema: z4.object({ data: z4.unknown().array() }),
      })

      return response.data
    },

    providers: async () => {
      const response = await orFetch('/api/frontend/all-providers', {
        schema: z4.object({ data: z4.unknown().array() }),
      })

      return response.data
    },

    models: async () => {
      const response = await orFetch('/api/frontend/models', {
        schema: z4.object({ data: z4.unknown().array() }),
      })

      return response.data
    },

    endpoints: async ({ permaslug, variant }: { permaslug: string; variant: string }) => {
      const response = await orFetch('/api/frontend/stats/endpoint', {
        params: { permaslug, variant },
        schema: z4.object({ data: z4.unknown().array() }),
      })

      return response.data
    },

    uptimes: async ({ uuid }: { uuid: string }) => {
      const response = await orFetch('/api/frontend/stats/uptime-hourly', {
        params: { id: uuid },
        schema: z4.object({ data: z4.unknown() }),
      })

      return response.data
    },

    author: async ({ authorSlug }: { authorSlug: string }) => {
      const response = await orFetch('/api/frontend/model-author', {
        params: { authorSlug, shouldIncludeStats: true, shouldIncludeVariants: false },
        schema: z4.object({ data: z4.unknown() }),
      })

      return response.data
    },
  },
}
