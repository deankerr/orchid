import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'

import * as DB from '@/convex/db'

import { query } from '../_generated/server'

// * queries
export const get = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await DB.OrModels.get(ctx, args)
  },
})

export const list = query({
  handler: async (ctx) => {
    return await DB.OrModels.list(ctx)
  },
})

export const getDetails = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await DB.OrModelDetails.get(ctx, args.slug)
  },
})

export const getTokenStats = query({
  args: {
    permaslug: v.string(),
    variants: v.array(v.string()),
  },
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
  handler: async (ctx, { permaslug, variants }) => {
    return await asyncMap(variants, async (variant) => {
      return await DB.OrModelAppLeaderboards.get(ctx, { permaslug, variant })
    })
  },
})
