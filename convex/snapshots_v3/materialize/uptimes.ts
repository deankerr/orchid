import type { Doc } from '../../_generated/dataModel'
import { ActionCtx } from '../../_generated/server'
import * as Transforms from '../transforms'
import { getFromStorage, pick } from './utils'

/**
 * Compute the mean uptime for a given endpoint UUID if the crawl included
 * the `/stats/uptime-hourly` archive for that UUID.
 */
export async function calculateUptimeAverage(
  ctx: ActionCtx,
  archives: Doc<'snapshot_raw_archives'>[],
  endpointUuid: string,
): Promise<number | undefined> {
  const uptimeRow = pick(
    archives,
    (r) =>
      r.path.includes('/api/frontend/stats/uptime-hourly') && r.path.includes(`id=${endpointUuid}`),
  )
  if (!uptimeRow) return undefined

  try {
    const { data } = await getFromStorage(ctx, uptimeRow.storage_id)
    if (!data?.length) return undefined

    const parsed = Transforms.uptimes.safeParse(data[0])
    if (!parsed.success) return undefined

    const valid = parsed.data.filter((u) => u.uptime != null).map((u) => u.uptime!)
    return valid.length ? valid.reduce((s, u) => s + u, 0) / valid.length : undefined
  } catch (error) {
    console.error(`Failed to calculate uptime for endpoint ${endpointUuid}:`, error)
    return undefined
  }
}
