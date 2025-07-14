import { v } from 'convex/values'

import { diff as jsonDiff, type IChange } from 'json-diff-ts'

import { internalMutation, type MutationCtx } from '../../_generated/server'
import { Table2 } from '../../table2'
import { type UpsertResult } from '../output'

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

const diff = (a: unknown, b: unknown) =>
  jsonDiff(a, b, {
    keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
  })

const recordChanges = async (
  ctx: MutationCtx,
  { content, changes }: { content: { app_id: number; snapshot_at: number }; changes: IChange[] },
) => {
  if (changes.length === 0) return
  const { app_id, snapshot_at } = content
  await ctx.db.insert(OrAppsChanges.name, { app_id, snapshot_at, changes })
}

export const upsert = internalMutation({
  args: {
    items: v.array(OrApps.content),
  },
  handler: async (ctx, { items }: { items: (typeof OrApps.$content)[] }) => {
    const results: UpsertResult[] = []

    for (const item of items) {
      const existing = await ctx.db
        .query(OrApps.name)
        .withIndex('by_app_id', (q) => q.eq('app_id', item.app_id))
        .first()
      const changes = diff(existing ?? {}, item)

      // Record changes
      await recordChanges(ctx, { content: item, changes })

      // Insert
      if (!existing) {
        await ctx.db.insert(OrApps.name, item)
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
