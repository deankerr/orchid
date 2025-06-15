import z4 from 'zod/v4'
import { orFetch } from '../openrouter/client'
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

  const uptimes: EndpointUptimeStats[] = []
  const transform: { index: number; error: z4.ZodError }[] = []
  const strict: { index: number; error: z4.ZodError }[] = []

  const r1 = EndpointUptimeTransformSchema.safeParse(result.data)
  if (r1.success) {
    uptimes.push(
      ...r1.data.map((item) => ({
        endpoint_uuid,
        timestamp: item.timestamp,
        uptime: item.uptime || undefined,
      })),
    )
  } else {
    transform.push({ index: 0, error: r1.error })
  }

  const r2 = EndpointUptimeStrictSchema.safeParse(result.data)
  if (!r2.success) {
    strict.push({ index: 0, error: r2.error })
  }

  return { uptimes, issues: { transform, strict } }
}
