import z4 from 'zod/v4'

import { gunzipSync, gzipSync } from 'fflate'

import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import { type ActionCtx } from '../_generated/server'

/**
 * Store raw response data for a snapshot archive
 */
export async function storeSnapshotData(
  ctx: ActionCtx,
  args: {
    run_id: string
    snapshot_at: number
    type: string
    params?: string
    data: unknown
  },
) {
  const { run_id, snapshot_at, type, params, data } = args

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
  return await ctx.runMutation(internal.openrouter.output.insertSnapshotArchive, {
    run_id,
    snapshot_at,
    type,
    params,
    size: originalSize,
    storage_id,
    sha256: storageMetadata.sha256,
  })
}

/**
 * Retrieve and decompress archive data
 */
export async function retrieveArchive<T>(
  ctx: ActionCtx,
  args: { storage_id: Id<'_storage'>; schema: z4.ZodType<T> },
) {
  const { storage_id, schema } = args
  const blob = await ctx.storage.get(storage_id)
  if (!blob) {
    throw new Error(`Archive not found in storage: ${storage_id}`)
  }

  // Get compressed data and decompress
  const buffer = await blob.arrayBuffer()
  const compressed = new Uint8Array(buffer)
  const decompressed = gunzipSync(compressed)

  // Parse JSON
  const json = JSON.parse(new TextDecoder().decode(decompressed))

  return schema.parse(json, { error: () => 'failed to parse archive' })
}

/**
 * Get archived data by type and params from a specific replay run
 */
export async function getArchivedData(
  ctx: ActionCtx,
  args: {
    replay: Id<'snapshot_runs'>
    type: string
    params?: string
  },
) {
  const { replay, type, params } = args

  // Find the specific archive record directly
  const archive = await ctx.runQuery(internal.db.snapshot.archives.getByRunIdTypeParams, {
    run_id: replay,
    type,
    params,
  })

  if (!archive) {
    throw new Error(
      `No archive found for run_id: ${replay}, type: ${type}, params: ${params || 'none'}`,
    )
  }

  // Retrieve and return the data
  return await retrieveArchive(ctx, {
    storage_id: archive.storage_id,
    schema: z4.object({ data: z4.unknown() }), // Standard wrapper schema
  })
}
