import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

import { query } from '../_generated/server'

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    entity_type: v.optional(
      v.union(v.literal('model'), v.literal('endpoint'), v.literal('provider')),
    ),
    change_action: v.optional(
      v.union(v.literal('create'), v.literal('update'), v.literal('delete')),
    ),
    include_hidden: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const showHidden = args.include_hidden ?? false

    if (args.entity_type) {
      if (showHidden) {
        // Show all changes for this entity type
        let query = ctx.db
          .query('or_changes')
          .withIndex('entity_type', (q) => q.eq('entity_type', args.entity_type!))
          .order('desc')
        
        if (args.change_action) {
          query = query.filter((q) => q.eq(q.field('change_action'), args.change_action!))
        }
        
        return await query.paginate(args.paginationOpts)
      } else {
        // Show only displayable changes for this entity type
        let query = ctx.db
          .query('or_changes')
          .withIndex('entity_type_display', (q) =>
            q.eq('entity_type', args.entity_type!).eq('is_display', true),
          )
          .order('desc')
        
        if (args.change_action) {
          query = query.filter((q) => q.eq(q.field('change_action'), args.change_action!))
        }
        
        return await query.paginate(args.paginationOpts)
      }
    }

    if (showHidden) {
      // Show all changes
      let query = ctx.db.query('or_changes').order('desc')
      
      if (args.change_action) {
        query = query.filter((q) => q.eq(q.field('change_action'), args.change_action!))
      }
      
      return await query.paginate(args.paginationOpts)
    } else {
      // Show only displayable changes
      let query = ctx.db
        .query('or_changes')
        .withIndex('is_display', (q) => q.eq('is_display', true))
        .order('desc')
      
      if (args.change_action) {
        query = query.filter((q) => q.eq(q.field('change_action'), args.change_action!))
      }
      
      return await query.paginate(args.paginationOpts)
    }
  },
})
