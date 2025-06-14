import { Table } from 'convex-helpers/server'
import { v, type Infer } from 'convex/values'
import { diff } from 'json-diff-ts'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { WithoutSystemFields } from 'convex/server'

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

export const AuthorViewFn = {
  get: async (ctx: QueryCtx, { slug }: { slug: string }) => {
    return await ctx.db
      .query(AuthorViews.name)
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'epoch'],
    })
  },

  merge: async (ctx: MutationCtx, { author }: { author: AuthorViewsDoc }) => {
    const existing = await AuthorViewFn.get(ctx, { slug: author.slug })
    const diff = AuthorViewFn.diff(existing || {}, author)

    if (existing) {
      await ctx.db.replace(existing._id, author)
      return {
        action: 'replace' as const,
        _id: existing._id,
        diff,
      }
    }

    const _id = await ctx.db.insert(AuthorViews.name, author)
    return {
      action: 'insert' as const,
      _id,
      diff,
    }
  },
}
