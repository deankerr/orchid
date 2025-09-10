import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { query, type QueryCtx } from '../../../_generated/server'
import { createTableVHelper } from '../../../table3'

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

  // details, informational only
  hugging_face_id: v.optional(v.string()),
  description: v.string(),
  tokenizer: v.string(),
  instruct_type: v.optional(v.string()),
  warning_message: v.optional(v.string()),

  // orchid
  unavailable_at: v.optional(v.number()),
  updated_at: v.number(),
})
  .index('by_name', ['name'])
  .searchIndex('by_name_search', { searchField: 'name' })

export const vTable = createTableVHelper('or_views_models', table.validator)

export async function collect(ctx: QueryCtx) {
  return await ctx.db.query(vTable.name).collect()
}

export const list = query({
  returns: vTable.doc.array(),
  handler: async (ctx) => {
    return await collect(ctx)
  },
})
