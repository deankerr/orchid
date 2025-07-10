import { internalMutation, query } from './_generated/server'
import { Entities } from './openrouter/registry'

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
        }
      })
      .toArray()
  },
})
