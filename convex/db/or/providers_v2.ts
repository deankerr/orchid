import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import type { QueryCtx } from '../../_generated/server'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
  slug: v.string(),

  name: v.string(),
  icon_url: v.string(),

  headquarters: v.optional(v.string()),
  datacenters: v.optional(v.array(v.string())),
  terms_of_service_url: v.string(),
  privacy_policy_url: v.string(),
  or_icon_url: v.string(),

  // orchid
  has_active_endpoint: v.boolean(),
  inactive_at: v.number(),
  updated_at: v.number(),
})

export const vTable = createTableVHelper('or_providers_v2', table.validator)

export async function list(ctx: QueryCtx) {
  return await ctx.db.query(vTable.name).collect()
}
