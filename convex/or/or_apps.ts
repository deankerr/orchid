import { Table } from 'convex-helpers/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { MergeResult } from '../types'

export const OrApps = Table('or_apps', {
  app_id: v.number(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  main_url: v.optional(v.string()),
  origin_url: v.string(),
  source_code_url: v.optional(v.string()),
  or_created_at: v.number(),

  snapshot_at: v.number(),
})

export type OrAppFields = Infer<AsObjectValidator<typeof OrApps.withoutSystemFields>>

export const OrAppsFn = {
  get: async (ctx: QueryCtx, { app_id }: { app_id: number }) => {
    return await ctx.db
      .query(OrApps.name)
      .withIndex('by_app_id', (q) => q.eq('app_id', app_id))
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    })
  },

  insertChanges: async (
    ctx: MutationCtx,
    args: { app_id: number; snapshot_at: number; changes: IChange[] },
  ) => {
    await ctx.db.insert('or_apps_changes', args)
  },

  merge: async (ctx: MutationCtx, { app }: { app: OrAppFields }): Promise<MergeResult> => {
    const existing = await OrAppsFn.get(ctx, { app_id: app.app_id })
    const changes = OrAppsFn.diff(existing || {}, app)

    // changes
    if (changes.length > 0) {
      await OrAppsFn.insertChanges(ctx, {
        app_id: app.app_id,
        snapshot_at: app.snapshot_at,
        changes,
      })
    }

    // new view
    if (!existing) {
      const docId = await ctx.db.insert(OrApps.name, app)
      return {
        action: 'insert' as const,
        docId,
        changes,
      }
    }

    // existing view
    if (changes.length === 0) {
      if (existing.snapshot_at < app.snapshot_at) {
        await ctx.db.patch(existing._id, {
          snapshot_at: app.snapshot_at,
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
