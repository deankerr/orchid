import { gunzipSync, gzipSync } from 'fflate'

import { internal } from '../_generated/api'
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
