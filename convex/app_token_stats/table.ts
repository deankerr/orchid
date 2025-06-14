import { Table } from 'convex-helpers/server'
import type { WithoutSystemFields } from 'convex/server'
import { v, type Infer } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { diff } from 'json-diff-ts'

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

  merge: async (ctx: MutationCtx, { appTokenStats }: { appTokenStats: AppTokenStatsDoc }) => {
    const existing = await AppTokenStatsFn.get(ctx, {
      app_id: appTokenStats.app_id,
      epoch: appTokenStats.epoch,
    })
    const diff = AppTokenStatsFn.diff(existing || {}, appTokenStats)

    if (existing) {
      await ctx.db.replace(existing._id, appTokenStats)
      return {
        action: 'replace' as const,
        _id: existing._id,
        diff,
      }
    }
  },
}
