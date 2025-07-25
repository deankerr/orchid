import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { diff as jsonDiff } from 'json-diff-ts'

import { fnInternalMutation, fnQuery } from '../../fnHelper'
import { countResults } from '../../openrouter/output'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  model_permaslug: v.string(),
  model_variant: v.string(),
  apps: v.array(
    v.object({
      app_id: v.number(),
      total_tokens: v.number(),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      main_url: v.optional(v.string()),
      origin_url: v.string(),
      source_code_url: v.optional(v.string()),
      or_created_at: v.number(),
    }),
  ),

  snapshot_at: v.number(),
}).index('by_permaslug_variant', ['model_permaslug', 'model_variant'])

export const vTable = createTableVHelper('or_model_app_leaderboards', table.validator)

const diff = (a: unknown, b: unknown) =>
  jsonDiff(a, b, {
    keysToSkip: ['_id', '_creationTime'],
  })

// * queries
export const get = fnQuery({
  args: {
    permaslug: v.string(),
    variants: v.array(v.string()),
  },
  handler: async (ctx, { permaslug, variants }) => {
    const results = await ctx.db
      .query(vTable.name)
      .withIndex('by_permaslug_variant', (q) => q.eq('model_permaslug', permaslug))
      .order('desc')
      .collect()

    return variants.map((variant) => results.find((r) => r.model_variant === variant) ?? null)
  },
})

// * snapshots
export const upsert = fnInternalMutation({
  args: { items: v.array(vTable.validator) },
  handler: async (ctx, args) => {
    const results = await asyncMap(args.items, async (item) => {
      const existing = await ctx.db
        .query('or_model_app_leaderboards')
        .withIndex('by_permaslug_variant', (q) =>
          q.eq('model_permaslug', item.model_permaslug).eq('model_variant', item.model_variant),
        )
        .first()

      const changes = diff(existing ?? {}, item)

      // Insert
      if (!existing) {
        await ctx.db.insert(vTable.name, item)
        return { action: 'insert' }
      }

      // Stable
      if (changes.length === 0) {
        return { action: 'stable' }
      }

      // Update
      await ctx.db.replace(existing._id, item)
      return { action: 'update' }
    })

    return countResults(results, 'modelAppLeaderboards')
  },
})
