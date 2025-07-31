import z4 from 'zod/v4'

import { up } from 'up-fetch'

import { api } from '../_generated/api'
import type { ActionCtx } from '../_generated/server'
import { retrieveArchive, storeSnapshotData } from './archive'
import { apps } from './transforms/apps'
import { endpoints } from './transforms/endpoints'
import { modelAuthor } from './transforms/modelAuthor'
import { models } from './transforms/models'
import { providers } from './transforms/providers'
import { uptimes } from './transforms/uptimes'
import type { RunConfig } from './types'
import type { Validator } from './validation'

// Sources creation context - consistent interface for all source creation functions
interface SourcesContext {
  ctx: ActionCtx
  config: RunConfig
  validator: Validator
}

const orFetch = up(fetch, () => ({
  baseUrl: 'https://openrouter.ai',
  retry: {
    attempts: 2,
    delay: (ctx) => ctx.attempt ** 2 * 1000,
  },
}))

export type Sources = Awaited<ReturnType<typeof createSources>>

export async function createSources(args: SourcesContext) {
  return args.config.replay_from
    ? await createArchiveSources(args)
    : await createRemoteSources(args)
}

export async function createRemoteSources(args: SourcesContext) {
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

export async function createArchiveSources(sourcesCtx: SourcesContext) {
  const { ctx, config, validator } = sourcesCtx

  if (!config.replay_from) {
    throw new Error('replay_from config required for archive sources')
  }

  const { run_id: currentRunId, snapshot_at: currentSnapshotAt } = config
  const { run_id: archiveRunId, snapshot_at: archiveSnapshotAt } = config.replay_from

  const archives = await ctx.runQuery(api.public.snapshots.getSnapshotArchives, {
    snapshot_at: archiveSnapshotAt,
  })

  return {
    models: async () => {
      // Find archive matching the archive run_id and type
      const archive = archives.find((a) => a.run_id === archiveRunId && a.type === 'models')
      if (!archive) {
        throw new Error(
          `No archived models data found for snapshot_at=${archiveSnapshotAt}, run_id=${archiveRunId}`,
        )
      }

      const archivedData = await retrieveArchive(ctx, {
        storage_id: archive.storage_id,
        schema: z4.object({ data: z4.unknown().array() }),
      })

      // Current format: API response object with data array
      const rawModels = archivedData.data
      const results = rawModels.map((raw) => models.safeParse(raw))

      return validator.process(results, {
        run_id: currentRunId,
        snapshot_at: currentSnapshotAt,
        source: 'models',
      })
    },

    endpoints: async ({ permaslug, variant }: { permaslug: string; variant: string }) => {
      const params = `${permaslug}-${variant}`

      // Find archive matching the archive run_id, type, and params
      const archive = archives.find(
        (a) => a.run_id === archiveRunId && a.type === 'endpoints' && a.params === params,
      )
      if (!archive) {
        throw new Error(
          `No archived endpoints data found for snapshot_at=${archiveSnapshotAt}, run_id=${archiveRunId}, params=${params}`,
        )
      }

      const archivedData = await retrieveArchive(ctx, {
        storage_id: archive.storage_id,
        schema: z4.object({ data: z4.unknown().array() }),
      })

      // Current format: API response object with data array
      const rawEndpoints = archivedData.data
      const results = rawEndpoints.map((raw) => endpoints.safeParse(raw))

      return validator.process(results, {
        run_id: currentRunId,
        snapshot_at: currentSnapshotAt,
        source: 'endpoints',
        params,
      })
    },

    apps: async ({ permaslug, variant }: { permaslug: string; variant: string }) => {
      const params = `${permaslug}-${variant}`

      // Find archive matching the archive run_id, type, and params
      const archive = archives.find(
        (a) => a.run_id === archiveRunId && a.type === 'apps' && a.params === params,
      )
      if (!archive) {
        throw new Error(
          `No archived apps data found for snapshot_at=${archiveSnapshotAt}, run_id=${archiveRunId}, params=${params}`,
        )
      }

      const archivedData = await retrieveArchive(ctx, {
        storage_id: archive.storage_id,
        schema: z4.object({ data: z4.unknown().array() }),
      })

      // Current format: API response object with data array
      const rawApps = archivedData.data
      const results = rawApps.map((raw) => apps.safeParse(raw))

      return validator.process(results, {
        run_id: currentRunId,
        snapshot_at: currentSnapshotAt,
        source: 'apps',
        params,
      })
    },

    providers: async () => {
      // Find archive matching the archive run_id and type
      const archive = archives.find((a) => a.run_id === archiveRunId && a.type === 'providers')
      if (!archive) {
        throw new Error(
          `No archived providers data found for snapshot_at=${archiveSnapshotAt}, run_id=${archiveRunId}`,
        )
      }

      const archivedData = await retrieveArchive(ctx, {
        storage_id: archive.storage_id,
        schema: z4.object({ data: z4.unknown().array() }),
      })

      // Current format: API response object with data array
      const rawProviders = archivedData.data
      const results = rawProviders.map((raw) => providers.safeParse(raw))

      return validator.process(results, {
        run_id: currentRunId,
        snapshot_at: currentSnapshotAt,
        source: 'providers',
      })
    },

    uptimes: async ({ uuid }: { uuid: string }) => {
      // Find archive matching the archive run_id, type, and params
      const archive = archives.find(
        (a) => a.run_id === archiveRunId && a.type === 'uptimes' && a.params === uuid,
      )
      if (!archive) {
        throw new Error(
          `No archived uptimes data found for snapshot_at=${archiveSnapshotAt}, run_id=${archiveRunId}, params=${uuid}`,
        )
      }

      const archivedData = await retrieveArchive(ctx, {
        storage_id: archive.storage_id,
        schema: z4.object({ data: z4.unknown() }),
      })

      // Current format: API response object with data field
      const result = uptimes.safeParse(archivedData.data)
      return validator.process([result], {
        run_id: currentRunId,
        snapshot_at: currentSnapshotAt,
        source: 'uptimes',
        params: uuid,
      })
    },

    modelAuthor: async ({ authorSlug }: { authorSlug: string }) => {
      // Find archive matching the archive run_id, type, and params
      const archive = archives.find(
        (a) => a.run_id === archiveRunId && a.type === 'modelAuthor' && a.params === authorSlug,
      )
      if (!archive) {
        throw new Error(
          `No archived modelAuthor data found for snapshot_at=${archiveSnapshotAt}, run_id=${archiveRunId}, params=${authorSlug}`,
        )
      }

      const archivedData = await retrieveArchive(ctx, {
        storage_id: archive.storage_id,
        schema: z4.object({ data: z4.unknown() }),
      })

      // Current format: API response object with data field
      const result = modelAuthor.safeParse(archivedData.data)
      return validator.process([result], {
        run_id: currentRunId,
        snapshot_at: currentSnapshotAt,
        source: 'modelAuthor',
        params: authorSlug,
      })
    },
  }
}
