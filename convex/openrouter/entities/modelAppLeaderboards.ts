import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'
import z4 from 'zod/v4'

import { internalMutation, query } from '../../_generated/server'
import { Table2 } from '../../table2'
import { orFetch } from '../sources'

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

async function pull({ permaslug, variant }: { permaslug: string; variant: string }) {
  const response = await orFetch('/api/frontend/stats/app', {
    params: { permaslug, variant },
    schema: z4.object({
      data: z4
        .object({
          app_id: z4.number(),
          total_tokens: z4.coerce.number(),
          app: z4.object({
            id: z4.number(),
            title: z4.string().nullable(),
            description: z4.string().nullable(),
            main_url: z4.string().nullable(),
            origin_url: z4.string(),
            source_code_url: z4.string().nullable(),
            created_at: z4.string(),
          }),
        })
        .array(),
    }),
  })

  return {
    model_permaslug: permaslug,
    model_variant: variant,
    apps: response.data.map((app) => ({
      app_id: app.app_id,
      total_tokens: app.total_tokens,
      title: app.app.title,
      description: app.app.description,
      main_url: app.app.main_url,
      origin_url: app.app.origin_url,
      source_code_url: app.app.source_code_url,
      or_created_at: app.app.created_at,
    })),
  }
}

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
