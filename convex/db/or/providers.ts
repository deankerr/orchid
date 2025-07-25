import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { diff as jsonDiff, type IChange } from 'json-diff-ts'

import type { MutationCtx } from '../../_generated/server'
import { fnInternalMutation, fnQuery } from '../../fnHelper'
import { countResults } from '../../openrouter/output'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  slug: v.string(),
  name: v.string(),
  headquarters: v.optional(v.string()),
  datacenters: v.optional(v.array(v.string())),
  icon: v.object({
    url: v.string(),
    invertRequired: v.optional(v.boolean()),
  }),
  status_page_url: v.optional(v.string()),
  moderation_required: v.boolean(),

  capabilities: v.object({
    completions: v.boolean(),
    chat_completions: v.boolean(),
    multipart_messages: v.boolean(),
    stream_cancellation: v.boolean(),
    byok: v.boolean(),
  }),

  data_policy: v.object({
    terms_of_service_url: v.optional(v.string()),
    privacy_policy_url: v.optional(v.string()),
    data_policy_url: v.optional(v.string()),
    requires_user_ids: v.optional(v.boolean()),

    paid_models: v.object({
      training: v.boolean(),
      retains_prompts: v.optional(v.boolean()),
      retention_days: v.optional(v.number()),
      can_publish: v.optional(v.boolean()),
    }),

    free_models: v.optional(
      v.object({
        training: v.boolean(),
        retains_prompts: v.optional(v.boolean()),
        retention_days: v.optional(v.number()),
        can_publish: v.optional(v.boolean()),
      }),
    ),
  }),

  snapshot_at: v.number(),
}).index('by_slug', ['slug'])

export const vTable = createTableVHelper('or_providers', table.validator)

const diff = (a: unknown, b: unknown) =>
  jsonDiff(a, b, {
    keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    embeddedObjKeys: {
      datacenters: '$value',
    },
  })

// * changes
export const changesTable = defineTable({
  slug: v.string(),
  snapshot_at: v.number(),
  changes: v.array(v.record(v.string(), v.any())),
})

export const vChangesTable = createTableVHelper('or_providers_changes', changesTable.validator)

const recordChanges = async (
  ctx: MutationCtx,
  { content, changes }: { content: { slug: string; snapshot_at: number }; changes: IChange[] },
) => {
  if (changes.length === 0) return
  const { slug, snapshot_at } = content
  await ctx.db.insert(vChangesTable.name, { slug, snapshot_at, changes })
}

// * queries
export const list = fnQuery({
  handler: async (ctx) => {
    return await ctx.db.query('or_providers').collect()
  },
})

// * snapshots
export const upsert = fnInternalMutation({
  args: { items: v.array(vTable.validator) },
  handler: async (ctx, args) => {
    const results = await asyncMap(args.items, async (item) => {
      const existing = await ctx.db
        .query(vTable.name)
        .withIndex('by_slug', (q) => q.eq('slug', item.slug))
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

    return countResults(results, 'providers')
  },
})
