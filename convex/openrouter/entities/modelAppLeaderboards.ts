import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'

import { internalMutation, query } from '../../_generated/server'
import { Table2 } from '../../table2'

export const OrModelAppLeaderboards = Table2('or_model_app_leaderboards', {
  model_permaslug: v.string(),
  model_variant: v.string(),
  apps: v.array(
    v.object({
      app_id: v.number(),
      total_tokens: v.number(),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      main_url: v.optional(v.string()),
      origin_url: v.string(),
      source_code_url: v.optional(v.string()),
      or_created_at: v.number(),
    }),
  ),

  snapshot_at: v.number(),
})

export const insert = internalMutation({
  args: {
    items: v.array(OrModelAppLeaderboards.content),
  },
  handler: async (ctx, { items }) => {
    return await asyncMap(items, async (item) => {
      return await ctx.db.insert(OrModelAppLeaderboards.name, item)
    })
  },
})

export const get = query({
  args: {
    permaslug: v.string(),
    snapshot_at: v.optional(v.number()),
  },
  handler: async (ctx, { permaslug, snapshot_at }) => {
    return await ctx.db
      .query('or_model_app_leaderboards')
      .withIndex('by_permaslug_snapshot_at', (q) => {
        return snapshot_at
          ? q.eq('model_permaslug', permaslug).eq('snapshot_at', snapshot_at)
          : q.eq('model_permaslug', permaslug)
      })
      .order('desc')
      .collect()
  },
})
