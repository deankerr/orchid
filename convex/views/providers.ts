import * as DB from '@/convex/db'

import { query } from '../_generated/server'

export const list = query({
  handler: async (ctx) => {
    return await DB.OrProviders.list(ctx)
  },
})
