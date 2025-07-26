import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { diff as jsonDiff, type IChange } from 'json-diff-ts'

import type { MutationCtx } from '../../_generated/server'
import { fnInternalMutation } from '../../fnHelper'
import { countResults } from '../../openrouter/utils'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  uuid: v.string(),
  slug: v.string(),
  name: v.string(),
  description: v.optional(v.string()),

  or_created_at: v.number(),
  or_updated_at: v.number(),

  snapshot_at: v.number(),
}).index('by_uuid', ['uuid'])

export const vTable = createTableVHelper('or_authors', table.validator)

const diff = (a: unknown, b: unknown) =>
  jsonDiff(a, b, {
    keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
  })

// * changes
export const changesTable = defineTable({
  uuid: v.string(),
  snapshot_at: v.number(),
  changes: v.array(v.record(v.string(), v.any())),
})

export const vChangesTable = createTableVHelper('or_authors_changes', changesTable.validator)

const recordChanges = async (
  ctx: MutationCtx,
  { content, changes }: { content: { uuid: string; snapshot_at: number }; changes: IChange[] },
) => {
  if (changes.length === 0) return
  const { uuid, snapshot_at } = content
  await ctx.db.insert(vChangesTable.name, { uuid, snapshot_at, changes })
}

// * snapshots
export const upsert = fnInternalMutation({
  args: { items: v.array(vTable.validator) },
  handler: async (ctx, args) => {
    const results = await asyncMap(args.items, async (item) => {
      const existing = await ctx.db
        .query(vTable.name)
        .withIndex('by_uuid', (q) => q.eq('uuid', item.uuid))
        .first()
      const changes = diff(existing ?? {}, item)

      // Record changes
      await recordChanges(ctx, { content: item, changes })

      // Insert
      if (!existing) {
        await ctx.db.insert(vTable.name, item)
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
