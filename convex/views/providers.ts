import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

import * as DB from '@/convex/db'

import { query } from '../_generated/server'
import { vChangesTableDoc } from '../lib/changesTable'
import { vPaginatedQueryReturn } from '../lib/validator'

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
  returns: vPaginatedQueryReturn(vChangesTableDoc('or_provider_changes')),
  handler: async (ctx, args) => {
    return await DB.OrProviderChanges.list(ctx, args)
  },
})
