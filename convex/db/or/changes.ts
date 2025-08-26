import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { createTableVHelper } from '../../table3'

export const table = defineTable({
  crawl_id: v.string(),
  from_crawl_id: v.string(),

  change_action: v.union(v.literal('create'), v.literal('update'), v.literal('delete')),
  change_root_key: v.string(),
  change_body: v.record(v.string(), v.any()),

  entity_type: v.union(v.literal('model'), v.literal('endpoint'), v.literal('provider')),
  entity_id: v.string(),
  entity_display_name: v.string(),

  model_variant_slug: v.optional(v.string()),
  endpoint_uuid: v.optional(v.string()),
  provider_slug: v.optional(v.string()),
  provider_id: v.optional(v.string()),

  is_display: v.boolean(),
})
  .index('crawl_id', ['crawl_id'])
  .index('entity_type', ['entity_type'])

export const vTable = createTableVHelper('or_changes', table.validator)
