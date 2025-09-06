import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import type { QueryCtx } from '../../_generated/server'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  slug: v.string(),
  base_slug: v.string(),
  version_slug: v.string(),
  variant: v.string(),

  name: v.string(),
  icon_url: v.string(),

  author_slug: v.string(),
  author_name: v.string(),

  or_added_at: v.number(),

  input_modalities: v.array(v.string()),
  output_modalities: v.array(v.string()),

  reasoning: v.boolean(),
  mandatory_reasoning: v.boolean(),

  // details
  hugging_face_id: v.optional(v.string()),
  description: v.string(),
  tokenizer: v.string(),
  instruct_type: v.optional(v.string()),
  warning_message: v.optional(v.string()),

  // orchid
  has_active_endpoint: v.boolean(),
  inactive_at: v.number(),
  updated_at: v.number(),
})

export const vTable = createTableVHelper('or_models_v2', table.validator)

export async function list(ctx: QueryCtx) {
  return await ctx.db.query(vTable.name).collect()
}
