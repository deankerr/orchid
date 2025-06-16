import z4 from 'zod/v4'
import { orFetch } from '../openrouter/client'
import { validateRecord } from '../openrouter/validation'
import type { EndpointUptimeStats } from './table'
import { EndpointUptimeStrictSchema, EndpointUptimeTransformSchema } from './schemas'

export async function snapshot({ endpoint_uuid }: { endpoint_uuid: string }) {
  const result = await orFetch('/api/frontend/stats/uptime-hourly', {
    params: {
      id: endpoint_uuid,
    },
    schema: z4.object({
      data: z4.unknown(),
    }),
  })

  const { item, issues } = validateRecord(
    result.data,
    EndpointUptimeTransformSchema,
    EndpointUptimeStrictSchema,
    (parsed) =>
      parsed.map((item) => ({
        endpoint_uuid,
        timestamp: item.timestamp,
        uptime: item.uptime,
      })),
  )

  const uptimes: EndpointUptimeStats[] = item

  return { uptimes, issues }
}
