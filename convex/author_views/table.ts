import { Table } from 'convex-helpers/server'
import { v, type Infer } from 'convex/values'
import { diff, type IChange } from 'json-diff-ts'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { WithoutSystemFields } from 'convex/server'
import type { MergeResult } from '../types'

export const AuthorViews = Table('author_views', {
  uuid: v.string(),
  slug: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  origin_created_at: v.number(),
  origin_updated_at: v.number(),

  epoch: v.number(),
})

export type AuthorViewsDoc = Infer<typeof AuthorViews.doc>
export type AuthorView = WithoutSystemFields<AuthorViewsDoc>

export const AuthorViewsFn = {
  get: async (ctx: QueryCtx, { uuid }: { uuid: string }) => {
    return await ctx.db
      .query(AuthorViews.name)
      .withIndex('by_uuid', (q) => q.eq('uuid', uuid))
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'epoch'],
    })
  },

  insertChanges: async (ctx: MutationCtx, args: { uuid: string; epoch: number; changes: IChange[] }) => {
    await ctx.db.insert('author_views_changes', args)
  },

  merge: async (ctx: MutationCtx, { author }: { author: AuthorView }): Promise<MergeResult> => {
    const existing = await AuthorViewsFn.get(ctx, { uuid: author.uuid })
    const changes = AuthorViewsFn.diff(existing || {}, author)

    // changes
    if (changes.length > 0) {
      await AuthorViewsFn.insertChanges(ctx, {
        uuid: author.uuid,
        epoch: author.epoch,
        changes,
      })
    }

    // new view
    if (!existing) {
      const _id = await ctx.db.insert(AuthorViews.name, author)
      return {
        action: 'insert' as const,
        _id,
        diff: changes,
      }
    }

    // existing view
    if (changes.length === 0) {
      if (existing.epoch < author.epoch) {
        await ctx.db.patch(existing._id, {
          epoch: author.epoch,
        })
      }

      return {
        action: 'stable' as const,
        _id: existing._id,
        diff: changes,
      }
    }

    await ctx.db.replace(existing._id, author)
    return {
      action: 'replace' as const,
      _id: existing._id,
      diff: changes,
    }
  },
}
