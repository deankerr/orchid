import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'

import { diff as jsonDiff, type IChange } from 'json-diff-ts'

import { internalMutation, type MutationCtx } from '../../_generated/server'
import { Table2 } from '../../table2'
import { countResults } from '../output'

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

const diff = (a: unknown, b: unknown) =>
  jsonDiff(a, b, {
    keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
  })

const recordChanges = async (
  ctx: MutationCtx,
  { content, changes }: { content: { uuid: string; snapshot_at: number }; changes: IChange[] },
) => {
  if (changes.length === 0) return
  const { uuid, snapshot_at } = content
  await ctx.db.insert(OrAuthorsChanges.name, { uuid, snapshot_at, changes })
}

export const upsert = internalMutation({
  args: {
    items: v.array(OrAuthors.content),
  },
  handler: async (ctx, { items }) => {
    const results = await asyncMap(items, async (item) => {
      const existing = await ctx.db
        .query(OrAuthors.name)
        .withIndex('by_uuid', (q) => q.eq('uuid', item.uuid))
        .first()
      const changes = diff(existing ?? {}, item)

      // Record changes
      await recordChanges(ctx, { content: item, changes })

      // Insert
      if (!existing) {
        await ctx.db.insert(OrAuthors.name, item)
        return { action: 'insert' }
      }

      // Stable - no changes
      if (changes.length === 0) {
        await ctx.db.patch(existing._id, { snapshot_at: item.snapshot_at })
        return { action: 'stable' }
      }

      // Update
      await ctx.db.replace(existing._id, item)
      return { action: 'update' }
    })

    return countResults(results, 'authors')
  },
})
