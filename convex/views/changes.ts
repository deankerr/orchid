import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'

import * as DB from '@/convex/db'

import { query } from '../_generated/server'

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    entity_type: v.optional(v.union(v.literal('model'), v.literal('endpoint'), v.literal('provider'))),
  },
  handler: async (ctx, args) => {
    if (args.entity_type) {
      return await ctx.db
        .query('or_changes')
        .withIndex('entity_type', (q) => q.eq('entity_type', args.entity_type!))
        .order('desc')
        .paginate(args.paginationOpts)
    }

    return await ctx.db
      .query('or_changes')
      .order('desc')
      .paginate(args.paginationOpts)
  },
})