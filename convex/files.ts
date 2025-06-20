import { Id } from '@/convex/_generated/dataModel'
import { Table } from 'convex-helpers/server'
import { ConvexError, v, type AsObjectValidator, type Infer } from 'convex/values'
import { gunzipSync, gzipSync } from 'fflate'
import { internal } from './_generated/api'
import { internalMutation, internalQuery, type ActionCtx } from './_generated/server'

// Simple file storage table
export const Files = Table('files_v2', {
  // Unique identifier for the file
  key: v.string(),

  snapshot_at: v.number(),

  // Storage reference
  storage_id: v.id('_storage'),

  // Size information
  size_original: v.number(), // Original size before any processing
  size_stored: v.number(), // Size as stored (may be compressed)

  // File integrity
  sha256: v.string(), // SHA256 of stored content

  // Optional fields
  compression: v.optional(v.string()), // 'gzip' if compressed, undefined if not
  metadata: v.optional(v.any()), // Additional metadata about the file
})

type FilesFields = Infer<AsObjectValidator<typeof Files.withoutSystemFields>>

// Simple store function - stores raw bytes without compression
export async function store(
  ctx: ActionCtx,
  args: {
    key: string
    snapshot_at: number
    data: Uint8Array
    metadata?: Record<string, unknown>
  },
): Promise<Id<'files_v2'>> {
  const { key, snapshot_at, data, metadata } = args

  // Create blob and store
  const blob = new Blob([data])
  const storage_id = await ctx.storage.store(blob)

  // Store file record
  return await ctx.runMutation(internal.files.insertFileRecord, {
    storage_id,
    key,
    snapshot_at,
    size_original: data.length,
    metadata,
  })
}

// Simple retrieve function - returns raw bytes
export async function retrieve(ctx: ActionCtx, file_id: Id<'files_v2'>): Promise<Uint8Array> {
  const file = await ctx.runQuery(internal.files.getFileRecord, { file_id })
  if (!file) throw new ConvexError('File not found')

  const blob = await ctx.storage.get(file.storage_id)
  if (!blob) throw new ConvexError('File not found in storage')

  const buffer = await blob.arrayBuffer()
  return new Uint8Array(buffer)
}

export async function retrieveByKey(
  ctx: ActionCtx,
  key: string,
): Promise<{ data: Uint8Array; metadata: FilesFields } | null> {
  const file = await ctx.runQuery(internal.files.getFileRecordByKey, { key })
  if (!file) return null

  const data = await retrieve(ctx, file._id)
  return { data, metadata: file as FilesFields }
}

export const insertFileRecord = internalMutation({
  args: {
    storage_id: v.id('_storage'),
    key: v.string(),
    snapshot_at: v.number(),
    size_original: v.number(),
    compression: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.id('files_v2'),
  handler: async (ctx, args): Promise<Id<'files_v2'>> => {
    const storageMetadata = await ctx.db.system.get(args.storage_id)
    if (!storageMetadata) throw new ConvexError('Storage metadata not found')

    return await ctx.db.insert('files_v2', {
      key: args.key,
      snapshot_at: args.snapshot_at,
      storage_id: args.storage_id,
      size_original: args.size_original,
      size_stored: storageMetadata.size,
      sha256: storageMetadata.sha256,
      compression: args.compression,
      metadata: args.metadata,
    })
  },
})

export const getFileRecord = internalQuery({
  args: {
    file_id: v.id('files_v2'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.file_id)
  },
})

export const getFileRecordByKey = internalQuery({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('files_v2')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .order('desc')
      .first()
  },
})

export const listFilesByPattern = internalQuery({
  args: {
    keyPrefix: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query('files_v2')
      .withIndex('by_key')
      .filter((q) => q.gte(q.field('key'), args.keyPrefix))
      .filter((q) => q.lt(q.field('key'), args.keyPrefix + '\uffff'))
      .order('desc')

    if (args.limit) {
      return await query.take(args.limit)
    }

    return await query.collect()
  },
})

// Convenience functions for JSON with optional compression

export async function storeJSON(
  ctx: ActionCtx,
  args: {
    key: string
    snapshot_at: number
    data: unknown
    compress?: boolean // For snapshot system
    metadata?: Record<string, unknown>
  },
): Promise<Id<'files_v2'>> {
  const { key, snapshot_at, data, compress = false, metadata } = args

  // Convert to JSON bytes
  const jsonString = JSON.stringify(data)
  let bytes = new TextEncoder().encode(jsonString)
  const originalSize = bytes.length

  let compression: string | undefined

  // Apply compression if requested (mainly for snapshots)
  if (compress) {
    bytes = gzipSync(bytes)
    compression = 'gzip'
  }

  // Create blob and store
  const blob = new Blob([bytes])
  const storage_id = await ctx.storage.store(blob)

  // Store file record with compression indicator
  return await ctx.runMutation(internal.files.insertFileRecord, {
    storage_id,
    key,
    snapshot_at,
    size_original: originalSize,
    compression,
    metadata,
  })
}

export async function retrieveJSON(ctx: ActionCtx, file_id: Id<'files_v2'>): Promise<unknown> {
  const file = await ctx.runQuery(internal.files.getFileRecord, { file_id })
  if (!file) throw new ConvexError('File not found')

  const blob = await ctx.storage.get(file.storage_id)
  if (!blob) throw new ConvexError('File not found in storage')

  // Get raw bytes
  const buffer = await blob.arrayBuffer()
  let bytes = new Uint8Array(buffer)

  // Decompress if needed
  if (file.compression === 'gzip') {
    bytes = gunzipSync(bytes) as Uint8Array<ArrayBuffer>
  }

  // Parse JSON
  return JSON.parse(new TextDecoder().decode(bytes))
}

export async function retrieveJSONByKey(
  ctx: ActionCtx,
  key: string,
): Promise<{ data: unknown; metadata: FilesFields } | null> {
  const file = await ctx.runQuery(internal.files.getFileRecordByKey, { key })
  if (!file) return null

  const data = await retrieveJSON(ctx, file._id)
  return { data, metadata: file as FilesFields }
}
