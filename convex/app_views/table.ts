import { Table } from 'convex-helpers/server'
import { v, type Infer } from 'convex/values'
import { diff, type IChange } from 'json-diff-ts'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { WithoutSystemFields } from 'convex/server'
import type { MergeResult } from '../types'

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

  insertChanges: async (ctx: MutationCtx, args: { app_id: number; epoch: number; changes: IChange[] }) => {
    await ctx.db.insert('app_views_changes', args)
  },

  merge: async (ctx: MutationCtx, { app }: { app: AppView }): Promise<MergeResult> => {
    const existing = await AppViewFn.get(ctx, { app_id: app.app_id })
    const changes = AppViewFn.diff(existing || {}, app)

    // changes
    if (changes.length > 0) {
      await AppViewFn.insertChanges(ctx, {
        app_id: app.app_id,
        epoch: app.epoch,
        changes,
      })
    }

    // new view
    if (!existing) {
      const docId = await ctx.db.insert(AppViews.name, app)
      return {
        action: 'insert' as const,
        docId,
        changes,
      }
    }

    // existing view
    if (changes.length === 0) {
      if (existing.epoch < app.epoch) {
        await ctx.db.patch(existing._id, {
          epoch: app.epoch,
        })
      }

      return {
        action: 'stable' as const,
        docId: existing._id,
        changes,
      }
    }

    await ctx.db.replace(existing._id, app)
    return {
      action: 'replace' as const,
      docId: existing._id,
      changes,
    }
  },
}
