import z4 from 'zod/v4'

import { up } from 'up-fetch'

import type { ActionCtx } from '../_generated/server'
import { storeSnapshotData } from './archive'
import { apps } from './transforms/apps'
import { endpoints } from './transforms/endpoints'
import { modelAuthor } from './transforms/modelAuthor'
import { models } from './transforms/models'
import { providers } from './transforms/providers'
import { uptimes } from './transforms/uptimes'
import type { RunConfig } from './types'

const orFetch = up(fetch, () => ({
  baseUrl: 'https://openrouter.ai',
  retry: {
    attempts: 2,
    delay: (ctx) => ctx.attempt ** 2 * 1000,
  },
}))

// Create sources - unified function for both remote and archive sources
export function createSources(ctx: ActionCtx, config: RunConfig) {
  const { run_id, snapshot_at, sources: sourceType } = config

  if (sourceType === 'archive') {
    return createArchiveSources(ctx, run_id)
  }

  return createRemoteSources(ctx, run_id, snapshot_at)
}

// Create sources from remote APIs with archival
function createRemoteSources(ctx: ActionCtx, runId: string, snapshotAt: number) {
  return {
    models: {
      retrieve: async () => {
        const response = await orFetch('/api/frontend/models', {
          schema: z4.object({ data: z4.unknown().array() }),
          onSuccess: async (data) => {
            await storeSnapshotData(ctx, {
              run_id: runId,
              snapshot_at: snapshotAt,
              type: 'models',
              data,
            })
          },
        })
        // Return all results (success and errors)
        return response.data.map((raw) => models.safeParse(raw))
      },
    },

    endpoints: ({ permaslug, variant }: { permaslug: string; variant: string }) => ({
      retrieve: async () => {
        const response = await orFetch('/api/frontend/stats/endpoint', {
          params: { permaslug, variant },
          schema: z4.object({ data: z4.unknown().array() }),
          onSuccess: async (data) => {
            const params = `${permaslug}-${variant}`
            await storeSnapshotData(ctx, {
              run_id: runId,
              snapshot_at: snapshotAt,
              type: 'endpoints',
              params,
              data,
            })
          },
        })
        // Return all results (success and errors)
        return response.data.map((raw) => endpoints.safeParse(raw))
      },
    }),

    apps: ({ permaslug, variant }: { permaslug: string; variant: string }) => ({
      retrieve: async () => {
        const response = await orFetch('/api/frontend/stats/app', {
          params: { permaslug, variant, limit: 20 },
          schema: z4.object({ data: z4.unknown().array() }),
          onSuccess: async (data) => {
            const params = `${permaslug}-${variant}`
            await storeSnapshotData(ctx, {
              run_id: runId,
              snapshot_at: snapshotAt,
              type: 'apps',
              params,
              data,
            })
          },
        })
        // Return all results (success and errors)
        return response.data.map((raw) => apps.safeParse(raw))
      },
    }),

    providers: {
      retrieve: async () => {
        const response = await orFetch('/api/frontend/all-providers', {
          schema: z4.object({ data: z4.unknown().array() }),
          onSuccess: async (data) => {
            await storeSnapshotData(ctx, {
              run_id: runId,
              snapshot_at: snapshotAt,
              type: 'providers',
              data,
            })
          },
        })
        // Return all results (success and errors)
        return response.data.map((raw) => providers.safeParse(raw))
      },
    },

    uptimes: ({ uuid }: { uuid: string }) => ({
      retrieve: async () => {
        const response = await orFetch('/api/frontend/stats/uptime-hourly', {
          params: { id: uuid },
          schema: z4.object({ data: z4.unknown() }),
          onSuccess: async (data) => {
            await storeSnapshotData(ctx, {
              run_id: runId,
              snapshot_at: snapshotAt,
              type: 'uptimes',
              params: uuid,
              data,
            })
          },
        })
        // Single item response - return as array
        return [uptimes.safeParse(response.data)]
      },
    }),

    modelAuthor: ({ authorSlug }: { authorSlug: string }) => ({
      retrieve: async () => {
        const response = await orFetch('/api/frontend/model-author', {
          params: { authorSlug, shouldIncludeStats: true, shouldIncludeVariants: false },
          schema: z4.object({ data: z4.unknown() }),
          onSuccess: async (data) => {
            await storeSnapshotData(ctx, {
              run_id: runId,
              snapshot_at: snapshotAt,
              type: 'modelAuthor',
              params: authorSlug,
              data,
            })
          },
        })
        // Single item response - return as array
        return [modelAuthor.safeParse(response.data)]
      },
    }),
  }
}

// Create sources from archived data
function createArchiveSources(ctx: ActionCtx, runId: string) {
  return {
    models: {
      retrieve: async () => {
        // TODO: read from stored file using retrieveArchive and apply transform
        console.log(`[ARCHIVE_READ] Loading models from run ${runId}`)
        return []
      },
    },

    endpoints: ({ permaslug, variant }: { permaslug: string; variant: string }) => ({
      retrieve: async () => {
        // TODO: read from stored file using retrieveArchive with params and apply transform
        const params = `${permaslug}-${variant}`
        console.log(`[ARCHIVE_READ] Loading endpoints ${params} from run ${runId}`)
        return []
      },
    }),

    apps: ({ permaslug, variant }: { permaslug: string; variant: string }) => ({
      retrieve: async () => {
        const params = `${permaslug}-${variant}`
        console.log(`[ARCHIVE_READ] Loading apps ${params} from run ${runId}`)
        return []
      },
    }),

    providers: {
      retrieve: async () => {
        console.log(`[ARCHIVE_READ] Loading providers from run ${runId}`)
        return []
      },
    },

    uptimes: ({ uuid }: { uuid: string }) => ({
      retrieve: async () => {
        console.log(`[ARCHIVE_READ] Loading uptimes ${uuid} from run ${runId}`)
        return []
      },
    }),

    modelAuthor: ({ authorSlug }: { authorSlug: string }) => ({
      retrieve: async () => {
        console.log(`[ARCHIVE_READ] Loading modelAuthor ${authorSlug} from run ${runId}`)
        return []
      },
    }),
  }
}

// Export the inferred Sources type
export type Sources = ReturnType<typeof createSources>
