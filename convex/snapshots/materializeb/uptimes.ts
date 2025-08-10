import { type ActionCtx } from '../../_generated/server'
import type { CrawlArchiveBundle } from '../crawlB'
import * as Transforms from '../transforms'

/**
 * Compute mean uptime for an endpoint UUID from the bundle's uptimes, if present.
 */
export async function calculateUptimeAverageFromBundle(
  _ctx: ActionCtx,
  bundle: CrawlArchiveBundle,
  endpointUuid: string,
): Promise<number | undefined> {
  // the bundle stores arbitrary raw uptime payloads; parse and average
  for (const entry of bundle.data.models) {
    const matched = entry.endpoints.find((e: any) => e.id === endpointUuid)
    if (!matched) continue
    for (const raw of entry.uptimes) {
      const parsed = Transforms.uptimes.safeParse(raw)
      if (!parsed.success) continue
      const series = parsed.data.filter((u) => u.uptime != null).map((u) => u.uptime!)
      if (!series.length) return undefined
      return series.reduce((s, u) => s + u, 0) / series.length
    }
  }
  return undefined
}
