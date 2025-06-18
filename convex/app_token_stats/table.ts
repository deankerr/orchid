import { Table } from 'convex-helpers/server'
import type { WithoutSystemFields } from 'convex/server'
import { v, type Infer } from 'convex/values'
import { diff } from 'json-diff-ts'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { MergeResult } from '../types'

export const AppTokenStats = Table('app_token_stats', {
  app_id: v.number(),
  total_tokens: v.number(),
  model_slug: v.string(),
  model_permaslug: v.string(),
  model_variant: v.optional(v.string()),

  epoch: v.number(),
})

export type AppTokenStatsDoc = Infer<typeof AppTokenStats.doc>
export type AppTokenStats = WithoutSystemFields<AppTokenStatsDoc>

export const AppTokenStatsFn = {
  get: async (ctx: QueryCtx, { app_id, epoch }: { app_id: number; epoch: number }) => {
    return await ctx.db
      .query(AppTokenStats.name)
      .withIndex('by_app_id_epoch', (q) => q.eq('app_id', app_id).eq('epoch', epoch))
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'epoch'],
    })
  },

  merge: async (
    ctx: MutationCtx,
    { appTokenStats }: { appTokenStats: AppTokenStats },
  ): Promise<MergeResult> => {
    const existing = await AppTokenStatsFn.get(ctx, {
      app_id: appTokenStats.app_id,
      epoch: appTokenStats.epoch,
    })
    const changes = AppTokenStatsFn.diff(existing || {}, appTokenStats)

    // new stats
    if (!existing) {
      const docId = await ctx.db.insert(AppTokenStats.name, appTokenStats)
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

    await ctx.db.replace(existing._id, appTokenStats)
    return {
      action: 'replace' as const,
      docId: existing._id,
      changes,
    }
  },
}
