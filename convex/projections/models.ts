import { v, type Infer } from 'convex/values'
import { z } from 'zod'
import type { Doc } from '../_generated/dataModel'
import { OpenRouterFrontendModelRecordSchema } from '../openrouter/schemas/api_frontend_models'
import { readSnapshotData } from '../snapshots'

// draft table schema
export const vModel = v.object({
  slug: v.string(),
  permaslug: v.string(),
  authorId: v.string(),
  contextLength: v.number(),

  orCreatedAt: v.number(),
  orUpdatedAt: v.number(),

  name: v.string(),
  shortName: v.string(),
  description: v.string(),
  tokenizer: v.string(),
  instructType: v.optional(v.string()),
  huggingfaceId: v.optional(v.string()),
  inputModalities: v.array(v.string()),
  outputModalities: v.array(v.string()),
  warningMessage: v.optional(v.string()),

  epoch: v.number(),
})

export function processModelSnapshot(snapshot: Doc<'snapshots'>) {
  const raw = readSnapshotData(snapshot)

  const { data } = z.object({ data: OpenRouterFrontendModelRecordSchema }).parse(raw)

  const model: Infer<typeof vModel> = {
    slug: data.slug,
    permaslug: data.permaslug,
    authorId: data.author,
    contextLength: data.context_length,

    orCreatedAt: new Date(data.created_at).getTime(),
    orUpdatedAt: new Date(data.updated_at).getTime(),

    name: data.name,
    shortName: data.short_name,
    description: data.description,
    tokenizer: data.group,
    instructType: data.instruct_type || undefined,
    huggingfaceId: data.hf_slug || undefined,
    inputModalities: data.input_modalities,
    outputModalities: data.output_modalities,
    warningMessage: data.warning_message || undefined,

    epoch: snapshot.epoch,
  }

  return model
}
