import { v } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { type MutationCtx, type QueryCtx } from '../../_generated/server'
import { Table2 } from '../../table2'

export const OrApps = Table2('or_apps', {
  app_id: v.number(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  main_url: v.optional(v.string()),
  origin_url: v.string(),
  source_code_url: v.optional(v.string()),
  or_created_at: v.number(),

  snapshot_at: v.number(),
})

export const OrAppsChanges = Table2('or_apps_changes', {
  app_id: v.number(),
  snapshot_at: v.number(),
  changes: v.array(v.record(v.string(), v.any())),
})

export const OrAppsFn = {
  get: async (ctx: QueryCtx, { app_id }: { app_id: number }) => {
    return await ctx.db
      .query(OrApps.name)
      .withIndex('by_app_id', (q) => q.eq('app_id', app_id))
      .first()
  },

  diff: (a: unknown, b: unknown) =>
    diff(a, b, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    }),

  recordChanges: async (
    ctx: MutationCtx,
    { content, changes }: { content: { app_id: number; snapshot_at: number }; changes: IChange[] },
  ) => {
    if (changes.length === 0) return
    const { app_id, snapshot_at } = content
    await ctx.db.insert(OrAppsChanges.name, { app_id, snapshot_at, changes })
  },
}
