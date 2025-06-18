import { Table } from 'convex-helpers/server'
import { v, type Infer } from 'convex/values'
import { diff, type IChange } from 'json-diff-ts'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { WithoutSystemFields } from 'convex/server'
import type { MergeResult } from '../types'

export const ModelViews = Table('model_views', {
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
  origin_created_at: v.number(),
  origin_updated_at: v.number(),

  epoch: v.number(),
})

export type ModelViewsDoc = Infer<typeof ModelViews.doc>
export type ModelView = WithoutSystemFields<ModelViewsDoc>

export const ModelsViewFn = {
  get: async (ctx: QueryCtx, { slug }: { slug: string }) => {
    return await ctx.db
      .query(ModelViews.name)
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
  },

  diff: <T extends object>(from: T, to: T) => {
    return diff(from, to, {
      keysToSkip: ['_id', '_creationTime', 'epoch'],
      embeddedObjKeys: {
        input_modalities: '$value',
        output_modalities: '$value',
        variants: '$value',
      },
    })
  },

  insertChanges: async (ctx: MutationCtx, args: { slug: string; epoch: number; changes: IChange[] }) => {
    await ctx.db.insert('model_views_changes', args)
  },

  merge: async (ctx: MutationCtx, { model }: { model: ModelView }): Promise<MergeResult> => {
    const existing = await ModelsViewFn.get(ctx, { slug: model.slug })
    const changes = ModelsViewFn.diff(existing || {}, model)

    // changes
    if (changes.length > 0) {
      await ModelsViewFn.insertChanges(ctx, {
        slug: model.slug,
        epoch: model.epoch,
        changes,
      })
    }

    // new view
    if (!existing) {
      const docId = await ctx.db.insert(ModelViews.name, model)
      return {
        action: 'insert' as const,
        docId,
        changes,
      }
    }

    // existing view
    if (changes.length === 0) {
      if (existing.epoch < model.epoch) {
        await ctx.db.patch(existing._id, {
          epoch: model.epoch,
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
