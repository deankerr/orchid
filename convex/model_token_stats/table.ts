import { Table } from 'convex-helpers/server'
import type { WithoutSystemFields } from 'convex/server'
import { v, type Infer } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { diff } from 'json-diff-ts'
import type { MergeResult } from '../types'

export const ModelTokenStats = Table('model_token_stats', {
  model_slug: v.string(),
  model_permaslug: v.string(),
  model_variant: v.string(),

  timestamp: v.number(),
  input_tokens: v.number(),
  output_tokens: v.number(),
  reasoning_tokens: v.number(),
  request_count: v.number(),
})

export type ModelTokenStatsDoc = Infer<typeof ModelTokenStats.doc>
export type ModelTokenStats = WithoutSystemFields<ModelTokenStatsDoc>

export const ModelTokenStatsFn = {
  get: async (
    ctx: QueryCtx,
    {
      model_permaslug,
      model_variant,
      timestamp,
    }: { model_permaslug: string; model_variant: string; timestamp: number },
  ) => {
    return await ctx.db
      .query(ModelTokenStats.name)
      .withIndex('by_model_permaslug_model_variant_timestamp', (q) =>
        q
          .eq('model_permaslug', model_permaslug)
          .eq('model_variant', model_variant)
          .eq('timestamp', timestamp),
      )
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime'],
    })
  },

  merge: async (ctx: MutationCtx, { modelTokenStats }: { modelTokenStats: ModelTokenStats }) => {
    const existing = await ModelTokenStatsFn.get(ctx, {
      model_permaslug: modelTokenStats.model_permaslug,
      model_variant: modelTokenStats.model_variant,
      timestamp: modelTokenStats.timestamp,
    })
    const diff = ModelTokenStatsFn.diff(existing || {}, modelTokenStats)

    if (existing) {
      if (diff.length === 0) {
        return {
          action: 'stable' as const,
          _id: existing._id,
          diff,
        }
      }

      await ctx.db.replace(existing._id, modelTokenStats)
      return {
        action: 'replace' as const,
        _id: existing._id,
        diff,
      }
    }

    const _id = await ctx.db.insert(ModelTokenStats.name, modelTokenStats)
    return {
      action: 'insert' as const,
      _id,
      diff,
    }
  },

  mergeTimeSeries: async (ctx: MutationCtx, { modelTokenStats }: { modelTokenStats: ModelTokenStats[] }) => {
    // stats come mixed up from the API, group them here
    const byPermaslugVariant = Map.groupBy(
      modelTokenStats,
      (stat) => stat.model_permaslug + ' ' + stat.model_variant,
    ).values()

    const resultsByPermaslugVariant = await Promise.all(
      byPermaslugVariant.map(async (modelTokenStats) => {
        // latest -> earliest
        modelTokenStats.sort((a, b) => a.timestamp - b.timestamp)

        const results: MergeResult[] = []
        for (const stat of modelTokenStats) {
          const result = await ModelTokenStatsFn.merge(ctx, { modelTokenStats: stat })
          results.push(result)

          if (result.action === 'stable') break // we already have this + all earlier entries
        }

        return results
      }),
    )

    return resultsByPermaslugVariant.flat()
  },
}
