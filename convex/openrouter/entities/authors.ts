import { v } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { type MutationCtx, type QueryCtx } from '../../_generated/server'
import { Table2 } from '../../table2'

export const OrAuthors = Table2('or_authors', {
  uuid: v.string(),
  slug: v.string(),
  name: v.string(),
  description: v.optional(v.string()),

  or_created_at: v.number(),
  or_updated_at: v.number(),

  snapshot_at: v.number(),
})

export const OrAuthorsChanges = Table2('or_authors_changes', {
  uuid: v.string(),
  snapshot_at: v.number(),
  changes: v.array(v.record(v.string(), v.any())),
})

export const OrAuthorsFn = {
  get: async (ctx: QueryCtx, { uuid }: { uuid: string }) => {
    return await ctx.db
      .query(OrAuthors.name)
      .withIndex('by_uuid', (q) => q.eq('uuid', uuid))
      .first()
  },

  list: async (ctx: QueryCtx) => {
    const results = await ctx.db.query(OrAuthors.name).collect()
    return results
  },

  diff: (a: unknown, b: unknown) =>
    diff(a, b, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    }),

  recordChanges: async (
    ctx: MutationCtx,
    { content, changes }: { content: { uuid: string; snapshot_at: number }; changes: IChange[] },
  ) => {
    if (changes.length === 0) return
    const { uuid, snapshot_at } = content
    await ctx.db.insert(OrAuthorsChanges.name, { uuid, snapshot_at, changes })
  },
}
