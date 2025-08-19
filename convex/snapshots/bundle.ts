import { gunzipSync } from 'fflate'

import { internal } from '../_generated/api'
import { type ActionCtx } from '../_generated/server'
import type { CrawlArchiveBundle } from './crawl'

const textDecoder = new TextDecoder()

export async function getArchiveBundle(
  ctx: ActionCtx,
  crawlId: string,
): Promise<CrawlArchiveBundle | null> {
  const archive = await ctx.runQuery(internal.db.snapshot.crawlArchives.getByCrawlId, {
    crawl_id: crawlId,
  })
  if (!archive) return null
  const blob = await ctx.storage.get(archive.storage_id)
  if (!blob) return null
  const decompressed = gunzipSync(new Uint8Array(await blob.arrayBuffer()))
  return JSON.parse(textDecoder.decode(decompressed)) as CrawlArchiveBundle
}
