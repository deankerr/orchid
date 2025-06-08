import { defineTable } from 'convex/server'
import { ConvexError, v, type AsObjectValidator, type Infer } from 'convex/values'
import { openrouter } from '../openrouter/client'
import { z } from 'zod'
import type { MutationCtx } from '../_generated/server'

export const endpointUptimeTable = defineTable({
  endpoint_uuid: v.string(),
  timestamp: v.number(),
  uptime: v.optional(v.number()),
}).index('by_endpoint_uuid_timestamp', ['endpoint_uuid', 'timestamp'])

export const vEndpointUptimeFields = endpointUptimeTable.validator.fields

const OpenRouterUptimeRecordSchema = z
  .object({
    history: z
      .object({
        date: z.string(),
        uptime: z
          .number()
          .nullable()
          .transform((v) => v || undefined),
      })
      .array(),
  })
  .transform((v) => v.history)

export async function fetchEndpointUptime(args: { endpoint_uuid: string }) {
  const result = await openrouter.frontend.stats.uptimeHourly({
    id: args.endpoint_uuid,
  })
  if (!result.success) throw new ConvexError('failed to get endpoint uptime')

  return OpenRouterUptimeRecordSchema.parse(result.data).map((item) => ({
    endpoint_uuid: args.endpoint_uuid,
    timestamp: new Date(item.date).getTime(),
    uptime: item.uptime,
  }))
}

export async function mergeEndpointUptimes(
  ctx: MutationCtx,
  uptimes: Infer<AsObjectValidator<typeof vEndpointUptimeFields>>[],
) {
  // group by uuid
  const mapByUuid = Map.groupBy(uptimes, (u) => u.endpoint_uuid)

  for (const [endpoint_uuid, uptimes] of mapByUuid) {
    if (uptimes.length === 0) continue

    // sort earliest to latest
    uptimes.sort((a, b) => a.timestamp - b.timestamp)

    // query timestamp range
    const earliest = uptimes[0].timestamp
    const latest = uptimes[uptimes.length - 1].timestamp

    const existingUptimes = await ctx.db
      .query('endpoint_uptime_v1')
      .withIndex('by_endpoint_uuid_timestamp', (q) =>
        q.eq('endpoint_uuid', endpoint_uuid).gte('timestamp', earliest).lte('timestamp', latest),
      )
      .collect()

    // insert new uptimes, replace existing if value is different
    for (const uptime of uptimes) {
      const existingUptime = existingUptimes.find((u) => u.timestamp === uptime.timestamp)
      if (existingUptime && existingUptime.uptime === uptime.uptime) continue
      if (existingUptime) await ctx.db.replace(existingUptime._id, uptime)
      else await ctx.db.insert('endpoint_uptime_v1', uptime)
    }
  }
}
