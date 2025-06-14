import { Table } from 'convex-helpers/server'
import { v, type Infer } from 'convex/values'
import { diff } from 'json-diff-ts'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { WithoutSystemFields } from 'convex/server'

export const AppViews = Table('app_views', {
  app_id: v.number(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  main_url: v.optional(v.string()),
  origin_url: v.string(),
  source_code_url: v.optional(v.string()),
  origin_created_at: v.number(),
  epoch: v.number(),
})

export type AppViewsDoc = Infer<typeof AppViews.doc>
export type AppView = WithoutSystemFields<AppViewsDoc>

export const AppViewFn = {
  get: async (ctx: QueryCtx, { app_id }: { app_id: number }) => {
    return await ctx.db
      .query(AppViews.name)
      .withIndex('by_app_id', (q) => q.eq('app_id', app_id))
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'epoch'],
    })
  },

  merge: async (ctx: MutationCtx, { app }: { app: AppViewsDoc }) => {
    const existing = await AppViewFn.get(ctx, { app_id: app.app_id })
    const diff = AppViewFn.diff(existing || {}, app)

    if (existing) {
      await ctx.db.replace(existing._id, app)
      return {
        action: 'replace' as const,
        _id: existing._id,
        diff,
      }
    }

    const _id = await ctx.db.insert(AppViews.name, app)
    return {
      action: 'insert' as const,
      _id,
      diff,
    }
  },
}
