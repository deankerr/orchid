import { gunzipSync } from 'fflate'

import { internal } from '../../_generated/api'
import { type ActionCtx } from '../../_generated/server'
import type { CrawlArchiveBundle } from '../crawlB'
import * as Transforms from '../transforms'

const textDecoder = new TextDecoder()

export async function getBundleFromCrawlId(
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

export function consolidateVariants(models: ReturnType<typeof Transforms.models.parse>[]) {
  return Map.groupBy(models, (m) => m.slug)
    .values()
    .map((variants) => {
      const [first, ...rest] = variants.sort((a, b) => a.name.length - b.name.length)
      const { variant, ...base } = first
      return {
        ...base,
        variants: [variant, ...rest.map((m) => m.variant)].filter(Boolean) as string[],
      }
    })
    .toArray()
}
export type ConsolidatedModel = ReturnType<typeof consolidateVariants>[number]
