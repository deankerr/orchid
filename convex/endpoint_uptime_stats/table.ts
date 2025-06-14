import { Table } from 'convex-helpers/server'
import type { WithoutSystemFields } from 'convex/server'
import { v, type Infer } from 'convex/values'

export const EndpointUptimeStats = Table('endpoint_uptime_stats', {
  endpoint_uuid: v.string(),
  timestamp: v.number(),
  uptime: v.optional(v.number()),
})

export type EndpointUptimeStatsDoc = Infer<typeof EndpointUptimeStats.doc>
export type EndpointUptimeStats = WithoutSystemFields<EndpointUptimeStatsDoc>
