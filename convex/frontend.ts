import { query } from './_generated/server'
import { Entities } from './openrouter/registry'

// NOTE convex fails to build if this is not here??
export const listOrProviders = query({
  args: {},
  handler: async (ctx) => {
    const providers = await ctx.db.query(Entities.providers.table.name).collect()
    return providers.sort((a, b) => a.name.localeCompare(b.name))
  },
})
