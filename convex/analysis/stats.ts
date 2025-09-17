import { v } from 'convex/values'

import { db } from '@/convex/db'

import { internalMutation } from '../_generated/server'

export const entityCounts = internalMutation({
  returns: v.null(),
  handler: async (ctx) => {
    const models = await db.or.views.models.collect(ctx)
    const endpoints = await db.or.views.endpoints.collect(ctx)
    const providers = new Set(endpoints.map((e) => e.provider.slug))

    console.log({
      models: models.length,
      endpoints: endpoints.length,
      providers: providers.size,
    })
  },
})
