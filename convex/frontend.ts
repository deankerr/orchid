import { query } from './_generated/server'
import { OrProviders } from './openrouter/entities/providers'

// NOTE convex fails to build if this is not here??
export const listOrProviders = query({
  args: {},
  handler: async (ctx) => {
    const providers = await ctx.db.query(OrProviders.name).collect()
    return providers.sort((a, b) => a.name.localeCompare(b.name))
  },
})
