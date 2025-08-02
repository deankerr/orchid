import z4 from 'zod/v4'

import { up } from 'up-fetch'

import { storeSnapshotData } from '../archive'
import { apps } from '../transforms/apps'
import { endpoints } from '../transforms/endpoints'
import { modelAuthor } from '../transforms/modelAuthor'
import { models } from '../transforms/models'
import { providers } from '../transforms/providers'
import { uptimes } from '../transforms/uptimes'
import type { Sources, SourcesContext } from './index'

const orFetch = up(fetch, () => ({
  baseUrl: 'https://openrouter.ai',
  retry: {
    attempts: 2,
    delay: (ctx) => ctx.attempt ** 2 * 1000,
  },
}))

// * Remote source implementation - fetches from OpenRouter APIs
export async function createRemoteSources(args: SourcesContext): Promise<Sources> {
  const { ctx, config, validator } = args
  const { run_id, snapshot_at } = config

  return {
    models: async () => {
      const response = await orFetch('/api/frontend/models', {
        schema: z4.object({ data: z4.unknown().array() }),
      })

      await storeSnapshotData(ctx, {
        run_id,
        snapshot_at,
        type: 'models',
        data: response,
      })

      const results = response.data.map((raw) => models.safeParse(raw))
      return validator.process(results, {
        run_id,
        snapshot_at,
        source: 'models',
      })
    },

    endpoints: async ({ permaslug, variant }: { permaslug: string; variant: string }) => {
      const response = await orFetch('/api/frontend/stats/endpoint', {
        params: { permaslug, variant },
        schema: z4.object({ data: z4.unknown().array() }),
      })

      const params = `${permaslug}-${variant}`
      await storeSnapshotData(ctx, {
        run_id,
        snapshot_at,
        type: 'endpoints',
        params,
        data: response,
      })

      const results = response.data.map((raw) => endpoints.safeParse(raw))
      return validator.process(results, {
        run_id,
        snapshot_at,
        source: 'endpoints',
        params,
      })
    },

    apps: async ({ permaslug, variant }: { permaslug: string; variant: string }) => {
      const response = await orFetch('/api/frontend/stats/app', {
        params: { permaslug, variant, limit: 20 },
        schema: z4.object({ data: z4.unknown().array() }),
      })

      const params = `${permaslug}-${variant}`
      await storeSnapshotData(ctx, {
        run_id,
        snapshot_at,
        type: 'apps',
        params,
        data: response,
      })

      const results = response.data.map((raw) => apps.safeParse(raw))
      return validator.process(results, {
        run_id,
        snapshot_at,
        source: 'apps',
        params,
      })
    },

    providers: async () => {
      const response = await orFetch('/api/frontend/all-providers', {
        schema: z4.object({ data: z4.unknown().array() }),
      })

      await storeSnapshotData(ctx, {
        run_id,
        snapshot_at,
        type: 'providers',
        data: response,
      })

      const results = response.data.map((raw) => providers.safeParse(raw))
      return validator.process(results, {
        run_id,
        snapshot_at,
        source: 'providers',
      })
    },

    uptimes: async ({ uuid }: { uuid: string }) => {
      const response = await orFetch('/api/frontend/stats/uptime-hourly', {
        params: { id: uuid },
        schema: z4.object({ data: z4.unknown() }),
      })

      await storeSnapshotData(ctx, {
        run_id,
        snapshot_at,
        type: 'uptimes',
        params: uuid,
        data: response,
      })

      const result = uptimes.safeParse(response.data)
      return validator.process([result], {
        run_id,
        snapshot_at,
        source: 'uptimes',
        params: uuid,
      })
    },

    modelAuthor: async ({ authorSlug }: { authorSlug: string }) => {
      const response = await orFetch('/api/frontend/model-author', {
        params: { authorSlug, shouldIncludeStats: true, shouldIncludeVariants: false },
        schema: z4.object({ data: z4.unknown() }),
      })

      await storeSnapshotData(ctx, {
        run_id,
        snapshot_at,
        type: 'modelAuthor',
        params: authorSlug,
        data: response,
      })

      const result = modelAuthor.safeParse(response.data)
      return validator.process([result], {
        run_id,
        snapshot_at,
        source: 'modelAuthor',
        params: authorSlug,
      })
    },
  }
}
