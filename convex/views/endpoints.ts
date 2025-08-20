import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

import * as DB from '@/convex/db'

import { query } from '../_generated/server'

export const list = query({
  returns: v.array(
    DB.OrEndpoints.vTable.doc.and({
      model_variant_slug: v.string(),
      traffic_share: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    const results = await DB.OrEndpoints.list(ctx).then((res) =>
      res.filter((endp) => !endp.is_disabled),
    )

    return Map.groupBy(results, (r) => `${r.model_slug}:${r.model_variant}`)
      .entries()
      .flatMap(([model_variant_slug, endpoints]) => {
        const totalRequests = endpoints.reduce(
          (sum, endp) => sum + (endp.stats?.request_count ?? 0),
          0,
        )

        return endpoints.map((endp) => ({
          ...endp,
          limits: {
            ...endp.limits,
            output_tokens: endp.limits.output_tokens ?? endp.context_length,
          },
          model_variant_slug,
          traffic_share:
            endp.stats?.request_count && totalRequests > 0
              ? (endp.stats?.request_count ?? 0) / totalRequests
              : undefined,
        }))
      })
      .toArray()
  },
})

export const listChanges = query({
  args: {
    entity_id: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  // returns: DB.OrModelChanges.vTable.doc.array(),
  handler: async (ctx, args) => {
    return await DB.OrEndpointChanges.list(ctx, args)
  },
})
