import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'

import * as DB from '@/convex/db'

import { query } from '../_generated/server'

// * queries
export const get = query({
  args: { slug: v.string() },
  returns: DB.OrModels.vTable.doc.nullable(),
  handler: async (ctx, args) => {
    return await DB.OrModels.get(ctx, args)
  },
})

export const list = query({
  returns: DB.OrModels.vTable.doc.array(),
  handler: async (ctx) => {
    const allModels = await DB.OrModels.list(ctx)
    const latestSnapshotAt = Math.max(...allModels.map((doc) => doc.snapshot_at))
    return allModels.filter((model) => model.snapshot_at === latestSnapshotAt)
  },
})

export const getDetails = query({
  args: { slug: v.string() },
  returns: DB.OrModelDetails.vTable.doc.nullable(),
  handler: async (ctx, args) => {
    return await DB.OrModelDetails.get(ctx, args.slug)
  },
})

export const getTokenStats = query({
  args: {
    permaslug: v.string(),
    variants: v.array(v.string()),
  },
  returns: v.array(DB.OrModelTokenStats.vTable.doc.nullable()),
  handler: async (ctx, { permaslug, variants }) => {
    return await asyncMap(variants, async (variant) => {
      return await DB.OrModelTokenStats.get(ctx, { permaslug, variant })
    })
  },
})

export const getAppLeaderboards = query({
  args: {
    permaslug: v.string(),
    variants: v.array(v.string()),
  },
  returns: v.array(DB.OrModelAppLeaderboards.vTable.doc.nullable()),
  handler: async (ctx, { permaslug, variants }) => {
    return await asyncMap(variants, async (variant) => {
      return await DB.OrModelAppLeaderboards.get(ctx, { permaslug, variant })
    })
  },
})
