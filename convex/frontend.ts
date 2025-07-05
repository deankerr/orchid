import { v } from 'convex/values'

import { query } from './_generated/server'
import { Entities } from './openrouter/registry'

export const getOrModel = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query(Entities.models.table.name)
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
  },
})

export const listOrModels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query(Entities.models.table.name).collect()
  },
})

export const listOrEndpoints = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query(Entities.endpoints.table.name)
      .withIndex('by_model_slug', (q) => q.eq('model_slug', args.slug))
      .collect()
  },
})

export const getOrModelTokenMetrics = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const models = await ctx.db.query(Entities.models.table.name).collect()
    const model = models.find((m) => m.slug === args.slug)

    if (!model) return []

    const n = model.variants.length * 72
    return await ctx.db
      .query(Entities.modelTokenMetrics.table.name)
      .withIndex('by_permaslug_timestamp', (q) => q.eq('model_permaslug', model.permaslug))
      .order('desc')
      .take(n)
  },
})

export const listOrProviders = query({
  args: {},
  handler: async (ctx) => {
    const providers = await ctx.db.query(Entities.providers.table.name).collect()
    return providers.sort((a, b) => a.name.localeCompare(b.name))
  },
})

export const getSnapshotStatus = query({
  handler: async (ctx) => {
    const latestRun = await ctx.db.query('snapshot_runs').order('desc').first()

    if (!latestRun) {
      return { status: 'unknown' as const, snapshot_at: null }
    }

    const isInProgress = !latestRun.ended_at
    const hasError = !latestRun.ok

    if (isInProgress) {
      return { status: 'in_progress' as const, snapshot_at: latestRun.snapshot_at }
    }

    if (hasError) {
      return { status: 'error' as const, snapshot_at: latestRun.snapshot_at }
    }

    return { status: 'ok' as const, snapshot_at: latestRun.snapshot_at }
  },
})

export const getSnapshotRuns = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 50 }) => {
    const runs = await ctx.db.query('snapshot_runs').order('desc').take(limit)

    return runs
  },
})

export const getSnapshotRunById = query({
  args: {
    runId: v.id('snapshot_runs'),
  },
  handler: async (ctx, { runId }) => {
    return await ctx.db.get(runId)
  },
})

export const getSnapshotArchives = query({
  args: {
    snapshot_at: v.number(),
  },
  handler: async (ctx, { snapshot_at }) => {
    const archives = await ctx.db
      .query('snapshot_archives')
      .withIndex('by_snapshot_at', (q) => q.eq('snapshot_at', snapshot_at))
      .order('desc')
      .collect()

    return archives
  },
})

export const getSnapshotArchiveTypes = query({
  args: {
    snapshot_at: v.number(),
  },
  handler: async (ctx, { snapshot_at }) => {
    const archives = await ctx.db
      .query('snapshot_archives')
      .withIndex('by_snapshot_at', (q) => q.eq('snapshot_at', snapshot_at))
      .collect()

    // Group by type and return summary info
    const typesSummary = archives.reduce((acc: Record<string, any>, archive: any) => {
      if (!acc[archive.type]) {
        acc[archive.type] = {
          type: archive.type,
          count: 0,
          totalSize: 0,
          latestCreation: 0,
        }
      }
      acc[archive.type].count++
      acc[archive.type].totalSize += archive.size
      acc[archive.type].latestCreation = Math.max(
        acc[archive.type].latestCreation,
        archive._creationTime,
      )
      return acc
    }, {})

    return Object.values(typesSummary).sort((a: any, b: any) => a.type.localeCompare(b.type))
  },
})

export const getLatestUptimeMetrics = query({
  args: {
    endpoint_uuid: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query(Entities.endpointUptimeMetrics.table.name)
      .withIndex('by_endpoint_uuid_timestamp', (q) => q.eq('endpoint_uuid', args.endpoint_uuid))
      .order('desc')
      .take(72)
  },
})
