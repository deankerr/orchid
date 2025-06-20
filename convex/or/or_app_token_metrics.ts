import { Table } from 'convex-helpers/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'
import { diff } from 'json-diff-ts'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { MergeResult } from '../types'

export const OrAppTokenMetrics = Table('or_app_token_metrics', {
  app_id: v.number(),
  total_tokens: v.number(),
  model_slug: v.string(),
  model_permaslug: v.string(),
  model_variant: v.optional(v.string()),

  snapshot_at: v.number(),
})

export type OrAppTokenMetricsFields = Infer<AsObjectValidator<typeof OrAppTokenMetrics.withoutSystemFields>>

export const OrAppTokenMetricsFn = {
  get: async (ctx: QueryCtx, { app_id, snapshot_at }: { app_id: number; snapshot_at: number }) => {
    return await ctx.db
      .query(OrAppTokenMetrics.name)
      .withIndex('by_app_id_snapshot_at', (q) => q.eq('app_id', app_id).eq('snapshot_at', snapshot_at))
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    })
  },

  merge: async (
    ctx: MutationCtx,
    { appTokenMetrics }: { appTokenMetrics: OrAppTokenMetricsFields },
  ): Promise<MergeResult> => {
    const existing = await OrAppTokenMetricsFn.get(ctx, {
      app_id: appTokenMetrics.app_id,
      snapshot_at: appTokenMetrics.snapshot_at,
    })
    const changes = OrAppTokenMetricsFn.diff(existing || {}, appTokenMetrics)

    // new stats
    if (!existing) {
      const docId = await ctx.db.insert(OrAppTokenMetrics.name, appTokenMetrics)
      return {
        action: 'insert' as const,
        docId,
        changes,
      }
    }

    // existing stats
    if (changes.length === 0) {
      return {
        action: 'stable' as const,
        docId: existing._id,
        changes,
      }
    }

    await ctx.db.replace(existing._id, appTokenMetrics)
    return {
      action: 'replace' as const,
      docId: existing._id,
      changes,
    }
  },
}
