import { Table } from 'convex-helpers/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { MergeResult } from '../types'

export const OrAuthors = Table('or_authors', {
  uuid: v.string(),
  slug: v.string(),
  name: v.string(),
  description: v.optional(v.string()),

  or_created_at: v.number(),
  or_updated_at: v.number(),

  snapshot_at: v.number(),
})

export const OrAuthorsChanges = Table('or_authors_changes', {
  uuid: v.string(),
  snapshot_at: v.number(),
  changes: v.array(v.record(v.string(), v.any())),
})

export type OrAuthorFields = Infer<AsObjectValidator<typeof OrAuthors.withoutSystemFields>>

export const OrAuthorsFn = {
  get: async (ctx: QueryCtx, { uuid }: { uuid: string }) => {
    return await ctx.db
      .query(OrAuthors.name)
      .withIndex('by_uuid', (q) => q.eq('uuid', uuid))
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    })
  },

  insertChanges: async (
    ctx: MutationCtx,
    args: { uuid: string; snapshot_at: number; changes: IChange[] },
  ) => {
    await ctx.db.insert(OrAuthorsChanges.name, args)
  },

  merge: async (ctx: MutationCtx, { author }: { author: OrAuthorFields }): Promise<MergeResult> => {
    const existing = await OrAuthorsFn.get(ctx, { uuid: author.uuid })
    const changes = OrAuthorsFn.diff(existing || {}, author)

    // changes
    if (changes.length > 0) {
      await OrAuthorsFn.insertChanges(ctx, {
        uuid: author.uuid,
        snapshot_at: author.snapshot_at,
        changes,
      })
    }

    // new view
    if (!existing) {
      const docId = await ctx.db.insert(OrAuthors.name, author)
      return {
        action: 'insert' as const,
        docId,
        changes,
      }
    }

    // existing view
    if (changes.length === 0) {
      if (existing.snapshot_at < author.snapshot_at) {
        await ctx.db.patch(existing._id, {
          snapshot_at: author.snapshot_at,
        })
      }

      return {
        action: 'stable' as const,
        docId: existing._id,
        changes,
      }
    }

    await ctx.db.replace(existing._id, author)
    return {
      action: 'replace' as const,
      docId: existing._id,
      changes,
    }
  },
}
