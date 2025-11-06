import { isDefined } from 'remeda'

import { internalMutation } from './_generated/server'
import { db } from './db'

export const migrate_mandatory_reasoning = internalMutation({
  args: {},
  handler: async (ctx) => {
    const models = await db.or.views.models.collect(ctx)

    for (const model of models) {
      if (isDefined(model.mandatory_reasoning)) {
        await db.or.views.models.patch(ctx, model._id, {
          mandatory_reasoning: undefined,
        })
      }
    }

    const endpoints = await db.or.views.endpoints.collect(ctx)
    for (const endpoint of endpoints) {
      if (isDefined(endpoint.model.mandatory_reasoning)) {
        await db.or.views.endpoints.patch(ctx, endpoint._id, {
          model: {
            ...endpoint.model,
            mandatory_reasoning: undefined,
          },
        })
      }
    }
  },
})
