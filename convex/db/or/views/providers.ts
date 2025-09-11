import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { query, type QueryCtx } from '../../../_generated/server'
import { createTableVHelper } from '../../../table3'

export const table = defineTable({
  slug: v.string(),

  name: v.string(),
  icon_url: v.string(),

  headquarters: v.optional(v.string()),
  datacenters: v.optional(v.array(v.string())),
  status_page_url: v.optional(v.string()),
  terms_of_service_url: v.optional(v.string()),
  privacy_policy_url: v.optional(v.string()),

  // orchid
  unavailable_at: v.optional(v.number()),
  updated_at: v.number(),
}).index('by_name', ['name'])

export const vTable = createTableVHelper('or_views_providers', table.validator)

export async function collect(ctx: QueryCtx) {
  return await ctx.db.query(vTable.name).withIndex('by_name').order('asc').collect()
}

export const list = query({
  returns: vTable.doc.array(),
  handler: async (ctx) => {
    return await collect(ctx)
  },
})
