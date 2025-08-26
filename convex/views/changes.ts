import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

import { query } from '../_generated/server'

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    entity_type: v.optional(
      v.union(v.literal('model'), v.literal('endpoint'), v.literal('provider')),
    ),
    include_hidden: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const showHidden = args.include_hidden ?? false

    if (args.entity_type) {
      if (showHidden) {
        // Show all changes for this entity type
        return await ctx.db
          .query('or_changes')
          .withIndex('entity_type', (q) => q.eq('entity_type', args.entity_type!))
          .order('desc')
          .paginate(args.paginationOpts)
      } else {
        // Show only displayable changes for this entity type
        return await ctx.db
          .query('or_changes')
          .withIndex('entity_type_display', (q) =>
            q.eq('entity_type', args.entity_type!).eq('is_display', true),
          )
          .order('desc')
          .paginate(args.paginationOpts)
      }
    }

    if (showHidden) {
      // Show all changes
      return await ctx.db.query('or_changes').order('desc').paginate(args.paginationOpts)
    } else {
      // Show only displayable changes
      return await ctx.db
        .query('or_changes')
        .withIndex('is_display', (q) => q.eq('is_display', true))
        .order('desc')
        .paginate(args.paginationOpts)
    }
  },
})
