import { v } from 'convex/values'

import * as DB from '@/convex/db'

import { internalMutation } from '../_generated/server'

export const entityCounts = internalMutation({
  returns: v.null(),
  handler: async (ctx) => {
    const models = await DB.OrViewsModels.collect(ctx)
    const endpoints = await DB.OrViewsEndpoints.collect(ctx)
    const providers = new Set(endpoints.map((e) => e.provider.slug))

    console.log({
      models: models.length,
      endpoints: endpoints.length,
      providers: providers.size,
    })
  },
})
