import { Table } from 'convex-helpers/server'
import { v } from 'convex/values'
import { gunzipSync, gzipSync } from 'fflate'
import { internalMutation, internalQuery, type ActionCtx } from '../_generated/server'
import { internal } from '../_generated/api'

export const SnapshotArchives = Table('snapshot_archives', {
  run_id: v.string(),
  snapshot_at: v.number(),
  type: v.string(), // endpoint name e.g. models/endpoints etc. or report
  size: v.number(), // original
  storage_id: v.id('_storage'),
  sha256: v.string(),
})

/**
 * Store raw response data for a snapshot archive
 */
export async function storeSnapshotData(
  ctx: ActionCtx,
  args: {
    run_id: string
    snapshot_at: number
    type: string
    data: unknown
  },
) {
  const { run_id, snapshot_at, type, data } = args

  // Convert to JSON and get original size
  const jsonString = JSON.stringify(data)
  const originalSize = new TextEncoder().encode(jsonString).length

  // Compress the data
  const compressed = gzipSync(new TextEncoder().encode(jsonString))

  // Store compressed data in Convex storage
  const blob = new Blob([compressed])
  const storage_id = await ctx.storage.store(blob)

  // Get storage metadata for sha256
  const storageMetadata = await ctx.storage.getMetadata(storage_id)
  if (!storageMetadata) {
    throw new Error('Failed to get storage metadata')
  }

  // Save archive record
  return await ctx.runMutation(internal.openrouter.archives.insertArchiveRecord, {
    run_id,
    snapshot_at,
    type,
    size: originalSize,
    storage_id,
    sha256: storageMetadata.sha256,
  })
}

/**
 * Retrieve and decompress archive data
 */
export async function retrieveArchive(ctx: ActionCtx, storage_id: string) {
  const blob = await ctx.storage.get(storage_id as any)
  if (!blob) {
    throw new Error('Archive not found in storage')
  }

  // Get compressed data and decompress
  const buffer = await blob.arrayBuffer()
  const compressed = new Uint8Array(buffer)
  const decompressed = gunzipSync(compressed)

  // Parse JSON
  return JSON.parse(new TextDecoder().decode(decompressed))
}

/**
 * Get the latest snapshot timestamp
 */
export async function getLatestSnapshot(ctx: ActionCtx) {
  return await ctx.runQuery(internal.openrouter.archives.queryLatestSnapshot)
}

/**
 * Get all archives for a specific snapshot
 */
export async function getSnapshotArchives(ctx: ActionCtx, snapshot_at: number) {
  return await ctx.runQuery(internal.openrouter.archives.querySnapshotArchives, { snapshot_at })
}

/**
 * Get a specific archive by snapshot_at and type
 */
export async function getSnapshotArchive(ctx: ActionCtx, snapshot_at: number, type: string) {
  const archive = await ctx.runQuery(internal.openrouter.archives.querySnapshotArchive, {
    snapshot_at,
    type,
  })

  if (!archive) {
    return null
  }

  const data = await retrieveArchive(ctx, archive.storage_id)
  return { archive, data }
}

/**
 * Internal mutation to save archive record
 */
export const insertArchiveRecord = internalMutation({
  args: SnapshotArchives.withoutSystemFields,
  handler: async (ctx, args) => {
    return await ctx.db.insert('snapshot_archives', args)
  },
})

/**
 * Get the latest snapshot timestamp
 */
export const queryLatestSnapshot = internalQuery({
  args: {},
  handler: async (ctx) => {
    const latest = await ctx.db.query('snapshot_archives').withIndex('by_snapshot_at').order('desc').first()

    return latest?.snapshot_at || null
  },
})

/**
 * Get all archives for a specific snapshot
 */
export const querySnapshotArchives = internalQuery({
  args: { snapshot_at: v.number() },
  handler: async (ctx, { snapshot_at }) => {
    return await ctx.db
      .query('snapshot_archives')
      .withIndex('by_snapshot_at', (q) => q.eq('snapshot_at', snapshot_at))
      .collect()
  },
})

/**
 * Get a specific archive by snapshot_at and type
 */
export const querySnapshotArchive = internalQuery({
  args: {
    snapshot_at: v.number(),
    type: v.string(),
  },
  handler: async (ctx, { snapshot_at, type }) => {
    return await ctx.db
      .query('snapshot_archives')
      .withIndex('by_snapshot_at', (q) => q.eq('snapshot_at', snapshot_at))
      .filter((q) => q.eq(q.field('type'), type))
      .first()
  },
})
