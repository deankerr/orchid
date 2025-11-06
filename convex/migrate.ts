import { internalMutation } from './_generated/server'
import { db } from './db'

export const migrate_description = internalMutation({
  args: {},
  handler: async (ctx) => {
    const models = await db.or.views.models.collect(ctx)
    for (const model of models) {
      await db.or.views.models.patch(ctx, model._id, {
        description: undefined,
      })
    }
  },
})
