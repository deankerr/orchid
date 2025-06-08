import { defineTable } from 'convex/server'
import { ConvexError, v, type AsObjectValidator, type Infer } from 'convex/values'
import { OpenRouterFrontendModelRecordSchema } from '../openrouter/schemas/api_frontend_models'
import { openrouter } from '../openrouter/client'
import { z } from 'zod'
import type { MutationCtx } from '../_generated/server'
import { diff } from 'json-diff-ts'

export const modelsTable = defineTable({
  slug: v.string(),
  permaslug: v.string(),
  author_slug: v.string(),
  hugging_face_id: v.optional(v.string()),

  name: v.string(),
  short_name: v.string(),
  description: v.string(),
  context_length: v.number(),
  input_modalities: v.array(v.string()),
  output_modalities: v.array(v.string()),
  tokenizer: v.string(),
  instruct_type: v.optional(v.string()),
  warning_message: v.optional(v.string()),
  origin_created_at: v.number(),
  origin_updated_at: v.number(),

  variants: v.array(v.string()),
  epoch: v.number(),
})
  .index('by_slug', ['slug'])
  .searchIndex('by_name', { searchField: 'name' })

export const vModelFields = modelsTable.validator.fields

function parseModelRecord(record: unknown) {
  const parsed = OpenRouterFrontendModelRecordSchema.extend({
    endpoint: z.object({ variant: z.string() }).nullable(),
  }).parse(record)

  return {
    slug: parsed.slug,
    permaslug: parsed.permaslug,
    author_slug: parsed.author,
    hugging_face_id: parsed.hf_slug || undefined,

    name: parsed.name,
    short_name: parsed.short_name,
    description: parsed.description,
    context_length: parsed.context_length,
    input_modalities: parsed.input_modalities,
    output_modalities: parsed.output_modalities,
    tokenizer: parsed.group,
    instruct_type: parsed.instruct_type || undefined,
    warning_message: parsed.warning_message || undefined,
    origin_created_at: new Date(parsed.created_at).getTime(),
    origin_updated_at: new Date(parsed.updated_at).getTime(),

    variant: parsed.endpoint?.variant,
  }
}

export async function fetchModels() {
  const result = await openrouter.frontend.models()
  if (!result.success) throw new ConvexError('failed to get models')

  const parsedRecords = result.data.map(parseModelRecord)
  const mapBySlug = Map.groupBy(parsedRecords, (r) => r.slug)

  // consolidate variants
  const models = [...mapBySlug.values()].map((records) => {
    // prefer 'standard' as base
    const { variant: baseVariant, ...baseRecord } =
      records.find((r) => r.variant === 'standard') || records[0]

    const variantSet = new Set([baseVariant, ...records.map((r) => r.variant)].filter((v) => v !== undefined))

    return { ...baseRecord, variants: Array.from(variantSet) }
  })

  console.log('models:', models.length, 'model_variants:', parsedRecords.length)
  return models
}

export async function mergeModel(ctx: MutationCtx, model: Infer<AsObjectValidator<typeof vModelFields>>) {
  const existingModel = await ctx.db
    .query('models_v1')
    .withIndex('by_slug', (q) => q.eq('slug', model.slug))
    .first()

  const diffResults = diff(existingModel || {}, model, {
    keysToSkip: ['_id', '_creationTime', 'epoch'],
    embeddedObjKeys: {
      input_modalities: '$value',
      output_modalities: '$value',
      variants: '$value',
    },
  })
  await ctx.db.insert('models_v1_diff', { name: model.name, epoch: model.epoch, diff: diffResults })

  if (existingModel) return await ctx.db.replace(existingModel._id, model)
  return await ctx.db.insert('models_v1', model)
}
