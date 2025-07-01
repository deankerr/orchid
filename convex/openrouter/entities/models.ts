import { v } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { type MutationCtx, type QueryCtx } from '../../_generated/server'
import { Table2 } from '../../table2'

export const OrModels = Table2('or_models', {
  slug: v.string(),
  permaslug: v.string(),
  variants: v.array(v.string()),

  author_slug: v.string(),

  name: v.string(),
  short_name: v.string(),
  description: v.string(),
  context_length: v.number(),
  input_modalities: v.array(v.string()),
  output_modalities: v.array(v.string()),
  tokenizer: v.string(),
  instruct_type: v.optional(v.string()),
  hugging_face_id: v.optional(v.string()),
  warning_message: v.optional(v.string()),

  or_created_at: v.number(),
  or_updated_at: v.number(),

  snapshot_at: v.number(),
})

export const OrModelsChanges = Table2('or_models_changes', {
  slug: v.string(),
  snapshot_at: v.number(),
  changes: v.array(v.record(v.string(), v.any())),
})

export const OrModelsFn = {
  get: async (ctx: QueryCtx, { slug }: { slug: string }) => {
    return await ctx.db
      .query(OrModels.name)
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
  },

  diff: (a: unknown, b: unknown) =>
    diff(a, b, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
      embeddedObjKeys: {
        input_modalities: '$value',
        output_modalities: '$value',
        variants: '$value',
      },
    }),

  recordChanges: async (
    ctx: MutationCtx,
    { content, changes }: { content: { slug: string; snapshot_at: number }; changes: IChange[] },
  ) => {
    if (changes.length === 0) return
    const { slug, snapshot_at } = content
    await ctx.db.insert(OrModelsChanges.name, { slug, snapshot_at, changes })
  },
}
