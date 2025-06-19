import { Id } from '@/convex/_generated/dataModel'
import { Table } from 'convex-helpers/server'
import { ConvexError, v, type AsObjectValidator, type Infer } from 'convex/values'
import { gunzipSync, gzipSync } from 'fflate'
import { internal } from './_generated/api'
import { internalMutation, internalQuery, type ActionCtx } from './_generated/server'

export const Files = Table('files_v1', {
  key: v.string(),
  timestamp: v.number(),
  storage_id: v.id('_storage'),

  size_compressed: v.number(),
  size: v.number(),
  content_type: v.string(),
  sha256: v.string(),
})

type FilesFields = Infer<AsObjectValidator<typeof Files.withoutSystemFields>>

function compressDataToBlob(data: string): Blob {
  const buf = new TextEncoder().encode(data)
  const compressed = gzipSync(buf)
  return new Blob([compressed], { type: 'application/gzip' })
}

async function decompressBlobToData(blob: Blob): Promise<string> {
  const compressed = new Uint8Array(await blob.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  return new TextDecoder().decode(decompressed)
}

export async function store(
  ctx: ActionCtx,
  { data, ...args }: Pick<FilesFields, 'key' | 'timestamp'> & { data: unknown },
) {
  const jsonString = JSON.stringify(data)
  const blob = compressDataToBlob(jsonString)
  const storage_id = await ctx.storage.store(blob)
  return await ctx.runMutation(internal.files.insertFileRecord, {
    storage_id,
    size: jsonString.length,
    ...args,
  })
}

export async function retrieve(ctx: ActionCtx, { file_id }: { file_id: Id<'files_v1'> }) {
  const file = await ctx.runQuery(internal.files.getFileRecord, { file_id })
  if (!file) throw new ConvexError('File not found')

  const blob = await ctx.storage.get(file.storage_id)
  if (!blob) throw new ConvexError('File not found in storage')

  return await decompressBlobToData(blob)
}

export const insertFileRecord = internalMutation({
  args: {
    storage_id: v.id('_storage'),
    key: v.string(),
    timestamp: v.number(),
    size: v.number(),
  },
  returns: v.id('files_v1'),
  handler: async (ctx, args): Promise<Id<'files_v1'>> => {
    const metadata = await ctx.db.system.get(args.storage_id)
    if (!metadata) throw new ConvexError('Storage metadata not found')

    return await ctx.db.insert('files_v1', {
      ...args,
      size_compressed: metadata.size,
      content_type: metadata.contentType ?? 'application/octet-stream',
      sha256: metadata.sha256,
    })
  },
})

export const getFileRecord = internalQuery({
  args: {
    file_id: v.id('files_v1'),
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
      .query('files_v1')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first()
  },
})
