import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalQuery } from '../../_generated/server'

export const table = defineTable({
  enabled: v.boolean(), // turn the whole thing on/off

  core_every_hours: v.number(), // models, endpoints, providers   (e.g. 1)
  authors_every_hours: v.number(), // model-author                  (e.g. 24)
  apps_every_hours: v.number(), // apps                           (e.g. 24)
  uptimes_every_hours: v.number(), // uptimes                        (e.g. 6)

  delay_minutes: v.number(), // fixed offset after the top of the hour
  jitter_minutes: v.number(), // random extra delay
})

export const getFirst = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('snapshot_crawl_config').first()
  },
})
