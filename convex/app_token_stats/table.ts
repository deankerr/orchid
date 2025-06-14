import { Table } from 'convex-helpers/server'
import type { WithoutSystemFields } from 'convex/server'
import { v, type Infer } from 'convex/values'

export const AppTokenStats = Table('app_token_stats', {
  app_id: v.number(),
  total_tokens: v.number(),
  model_slug: v.string(),
  model_permaslug: v.string(),
  model_variant: v.optional(v.string()),
  epoch: v.number(),
})

export type AppTokenStatsDoc = Infer<typeof AppTokenStats.doc>
export type AppTokenStats = WithoutSystemFields<AppTokenStatsDoc>
