import { internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import { output } from '../output'
import type { Entities } from '../registry'
import { validateRecord, type Issue } from '../validation'
import {
  EndpointUptimeStrictSchema,
  EndpointUptimeTransformSchema,
} from '../validators/endpointUptimesMetrics'

export async function endpointUptimeMetricsPipeline(
  ctx: ActionCtx,
  {
    snapshot_at,
    run_id,
    endpoints,
    source,
  }: {
    snapshot_at: number
    run_id: string
    endpoints: (typeof Entities.endpoints.table.$content)[]
    source: {
      endpointUptimes: (args: { uuid: string }) => Promise<unknown>
    }
  },
) {
  const endpointUptimes: (typeof Entities.endpointUptimeMetrics.table.$content)[] = []
  const issues: Issue[] = []

  for (const endpoint of endpoints) {
    const { item, issues: validationIssues } = validateRecord(
      await source.endpointUptimes({ uuid: endpoint.uuid }),
      EndpointUptimeTransformSchema,
      EndpointUptimeStrictSchema,
    )

    issues.push(...validationIssues)

    const uptimeMetrics = item.map((uptime) => ({
      endpoint_uuid: endpoint.uuid,
      timestamp: uptime.timestamp,
      uptime: uptime.uptime,
    }))

    endpointUptimes.push(...uptimeMetrics)
  }

  const results = await output(ctx, {
    entities: [
      {
        name: 'endpointUptimeMetrics',
        items: endpointUptimes,
      },
    ],
  })

  await ctx.runMutation(internal.openrouter.snapshot.insertResult, {
    snapshot_at,
    run_id,
    pipeline: 'endpointUptimeMetrics',
    results,
    issues,
  })
}
