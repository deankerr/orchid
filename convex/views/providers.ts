import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

import * as DB from '@/convex/db'

import { query } from '../_generated/server'

export const list = query({
  returns: DB.OrProviders.vTable.doc.array(),
  handler: async (ctx) => {
    return await DB.OrProviders.list(ctx)
  },
})

export const listChanges = query({
  args: {
    entity_id: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  // returns: DB.OrModelChanges.vTable.doc.array(),
  handler: async (ctx, args) => {
    return await DB.OrProviderChanges.list(ctx, args)
  },
})
