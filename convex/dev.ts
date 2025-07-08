import { internalMutation, query, type QueryCtx } from './_generated/server'
import { Entities } from './openrouter/registry'
import { getDayAlignedTimestamp } from './shared'

export const sizes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const m = await ctx.db.query('or_models').collect()
    const ms = new TextEncoder().encode(JSON.stringify(m)).length

    const e = await ctx.db.query('or_endpoints').collect()
    const es = new TextEncoder().encode(JSON.stringify(e)).length

    return {
      models: m.length,
      modelsSizeKb: ms / 1024,
      modelsAvgSizeKb: ms / m.length / 1024,
      endpoints: e.length,
      endpointsSizeKb: es / 1024,
      endpointsAvgSizeKb: es / e.length / 1024,
    }
  },
})

export const listEndpoints = query({
  handler: async (ctx) => {
    const results = await ctx.db.query(Entities.endpoints.table.name).collect()

    const metricsMap = await getTopModelTokens(ctx)

    return Map.groupBy(results, (r) => `${r.model_slug}:${r.model_variant}`)
      .entries()
      .map(([variantSlug, endpoints]) => {
        const totalRequests = endpoints.reduce(
          (acc, endp) => acc + (endp.stats?.request_count ?? 0),
          0,
        )
        const unionParameters = [...new Set(endpoints.flatMap((endp) => endp.supported_parameters))]
        const unionCapabilities = [
          ...new Set(
            endpoints.flatMap((endp) =>
              Object.entries(endp.capabilities)
                .filter(([, value]) => value === true)
                .map(([key]) => key),
            ),
          ),
        ]
        const [model_slug, variant] = variantSlug.split(':')
        return {
          variantSlug,
          totalRequests,
          unionCapabilities,
          unionParameters,
          model_slug,
          variant,
          endpoints: endpoints.map((endp) => ({
            ...endp,
            traffic: endp.stats?.request_count
              ? endp.stats.request_count / totalRequests
              : undefined,
          })),
          metrics: metricsMap?.get(variantSlug) ?? { tokens: 0, requests: 0, points: 0 },
        }
      })
      .toArray()
      .sort((a, b) => b.totalRequests - a.totalRequests)
  },
})

const DAY = 24 * 60 * 60 * 1000
async function getTopModelTokens(ctx: QueryCtx, days = 1) {
  // get latest any value
  const latest = await ctx.db.query('or_model_token_metrics').order('desc').first()
  if (!latest) return

  const to = getDayAlignedTimestamp(latest.timestamp) - DAY
  const from = to - days * DAY

  const metrics = await ctx.db
    .query('or_model_token_metrics')
    .withIndex('by_timestamp', (q) => q.gte('timestamp', from).lte('timestamp', to))
    .collect()

  const results = Map.groupBy(metrics, (m) => m.model_slug + ':' + m.model_variant)
    .entries()
    .map(([key, data]) => {
      const tokens = data.reduce((acc, cur) => acc + cur.input_tokens + cur.output_tokens, 0)
      const requests = data.reduce((acc, cur) => acc + cur.request_count, 0)
      const points = data.length
      return [key, { tokens, requests, points }] as const
    })

  return new Map(results)
}
