import { v } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { internalMutation, type MutationCtx, type QueryCtx } from '../../_generated/server'
import { Table2 } from '../../table2'
import { type UpsertResult } from '../output'

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

export const upsert = internalMutation({
  args: {
    items: v.array(OrAuthors.content),
  },
  handler: async (ctx, { items }: { items: (typeof OrAuthors.$content)[] }) => {
    const results: UpsertResult[] = []
    
    for (const item of items) {
      const existing = await OrAuthorsFn.get(ctx, { uuid: item.uuid })
      const changes = OrAuthorsFn.diff(existing ?? {}, item)

      // Record changes
      await OrAuthorsFn.recordChanges(ctx, { content: item, changes })

      // Insert
      if (!existing) {
        await ctx.db.insert(OrAuthors.name, item)
        results.push({ action: 'insert' })
        continue
      }

      // Stable - no changes
      if (changes.length === 0) {
        await ctx.db.patch(existing._id, { snapshot_at: item.snapshot_at })
        results.push({ action: 'stable' })
        continue
      }

      // Update
      await ctx.db.replace(existing._id, item)
      results.push({ action: 'update' })
    }

    return results
  },
})
