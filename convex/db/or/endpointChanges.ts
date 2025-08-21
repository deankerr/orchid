import { paginationOptsValidator } from 'convex/server'

import { query } from '../../_generated/server'
import { createChangesFunctions, createChangesTable } from '../../lib/changesTable'

// * Endpoint changes table for schema definition
export const table = createChangesTable()

// * Endpoint changes functions (created after schema is defined)
export const { list, insert, clearTable } = createChangesFunctions('or_endpoint_changes')

export const listLatest = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db.query('or_endpoint_changes').order('desc').paginate(args.paginationOpts)
  },
})
