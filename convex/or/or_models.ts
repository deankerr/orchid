import { Table } from 'convex-helpers/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { MergeResult } from '../types'

export const OrModels = Table('or_models', {
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

export type OrModelFields = Infer<AsObjectValidator<typeof OrModels.withoutSystemFields>>

export const OrModelsChanges = Table('or_models_changes', {
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

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
      embeddedObjKeys: {
        input_modalities: '$value',
        output_modalities: '$value',
        variants: '$value',
      },
    })
  },

  insertChanges: async (
    ctx: MutationCtx,
    args: { slug: string; snapshot_at: number; changes: IChange[] },
  ) => {
    await ctx.db.insert(OrModelsChanges.name, args)
  },

  merge: async (ctx: MutationCtx, { model }: { model: OrModelFields }): Promise<MergeResult> => {
    const existing = await OrModelsFn.get(ctx, { slug: model.slug })
    const changes = OrModelsFn.diff(existing || {}, model)

    // changes
    if (changes.length > 0) {
      await OrModelsFn.insertChanges(ctx, {
        slug: model.slug,
        snapshot_at: model.snapshot_at,
        changes,
      })
    }

    // new view
    if (!existing) {
      const docId = await ctx.db.insert(OrModels.name, model)
      return {
        action: 'insert' as const,
        docId,
        changes,
      }
    }

    // existing view
    if (changes.length === 0) {
      if (existing.snapshot_at < model.snapshot_at) {
        await ctx.db.patch(existing._id, {
          snapshot_at: model.snapshot_at,
        })
      }

      return {
        action: 'stable' as const,
        docId: existing._id,
        changes,
      }
    }

    await ctx.db.replace(existing._id, model)
    return {
      action: 'replace' as const,
      docId: existing._id,
      changes,
    }
  },
}
