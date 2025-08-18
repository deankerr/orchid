import { defineTable } from 'convex/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'

import { internalMutation, type QueryCtx } from '../../_generated/server'
import { createTableVHelper } from '../../table3'

export type ChangesTable = 'or_model_changes' | 'or_endpoint_changes' | 'or_provider_changes'

const fields = {
  entity_id: v.string(), // model slug, endpoint uuid, provider slug
  entity_name: v.string(), // readable name for development
  event_type: v.union(v.literal('add'), v.literal('remove'), v.literal('update')),

  crawl_id: v.string(),
  from_crawl_id: v.string(),

  // For updates only
  change_key: v.optional(v.string()), // top-level field that changed
  change_raw: v.any(), // raw json-diff-ts result object
}
export type ChangesTableFields = Infer<AsObjectValidator<typeof fields>>

// * Generic changes table schema
export function createChangesTable() {
  return defineTable(fields)
    .index('by_entity_id', ['entity_id'])
    .index('by_crawl_id', ['crawl_id'])
    .index('by_event_type', ['event_type'])
    .index('by_change_key', ['change_key'])
}

// * Create table and vTable helper for schema definition
export function createChangesTableHelper(tableName: ChangesTable) {
  const table = createChangesTable()
  const vTable = createTableVHelper(tableName, table.validator)

  return { table, vTable }
}

// * Create functions/endpoints that use the table (call after schema is defined)
export function createChangesFunctions(tableName: ChangesTable) {
  const listByEntityId = async (ctx: QueryCtx, args: { entity_id: string }) => {
    return await ctx.db
      .query(tableName)
      .withIndex('by_entity_id', (q) => q.eq('entity_id', args.entity_id))
      .collect()
  }

  const listByCrawlId = async (ctx: QueryCtx, args: { crawl_id: string }) => {
    return await ctx.db
      .query(tableName)
      .withIndex('by_crawl_id', (q) => q.eq('crawl_id', args.crawl_id))
      .collect()
  }

  const insertEvents = internalMutation({
    args: {
      events: v.array(v.object(fields)),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
      for (const event of args.events) {
        await ctx.db.insert(tableName, event)
      }
    },
  })

  return {
    listByEntityId,
    listByCrawlId,
    insertEvents,
  }
}
