import { gunzipSync } from 'fflate'

import { internal } from '../_generated/api'
import { type ActionCtx } from '../_generated/server'
import type { CrawlArchiveBundle } from './crawl'

const textDecoder = new TextDecoder()

export async function getArchiveBundleOrThrow(
  ctx: ActionCtx,
  crawl_id?: string,
): Promise<CrawlArchiveBundle> {
  const resolved_crawl_id =
    crawl_id ?? (await ctx.runQuery(internal.db.snapshot.crawl.archives.getLatestCrawlId))

  if (!resolved_crawl_id) {
    throw new Error('[bundle] no crawl_id found')
  }

  const bundle = await getArchiveBundle(ctx, resolved_crawl_id)
  if (!bundle) {
    throw new Error(`[bundle] no bundle found for crawl_id: ${resolved_crawl_id}`)
  }

  return bundle
}

export async function getArchiveBundle(
  ctx: ActionCtx,
  crawlId: string,
): Promise<CrawlArchiveBundle | null> {
  const archive = await ctx.runQuery(internal.db.snapshot.crawl.archives.getByCrawlId, {
    crawl_id: crawlId,
  })
  if (!archive) return null
  const blob = await ctx.storage.get(archive.storage_id)
  if (!blob) return null
  const decompressed = gunzipSync(new Uint8Array(await blob.arrayBuffer()))
  return JSON.parse(textDecoder.decode(decompressed)) as CrawlArchiveBundle
}
