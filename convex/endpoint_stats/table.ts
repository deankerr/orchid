import { Table } from 'convex-helpers/server'
import type { WithoutSystemFields } from 'convex/server'
import { v, type Infer } from 'convex/values'

export const EndpointStats = Table('endpoint_stats', {
  endpoint_uuid: v.string(),
  p50_latency: v.number(),
  p50_throughput: v.number(),
  request_count: v.number(),
  epoch: v.number(),
})

export type EndpointStatsDoc = Infer<typeof EndpointStats.doc>
export type EndpointStat = WithoutSystemFields<EndpointStatsDoc>
