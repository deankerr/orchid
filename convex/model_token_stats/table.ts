import { Table } from 'convex-helpers/server'
import type { WithoutSystemFields } from 'convex/server'
import { v, type Infer } from 'convex/values'

export const ModelTokenStats = Table('model_token_stats', {
  model_slug: v.string(),
  model_permaslug: v.string(),
  model_variant: v.string(),

  timestamp: v.number(),
  input_tokens: v.number(),
  output_tokens: v.number(),
  reasoning_tokens: v.number(),
  request_count: v.number(),
})

export type ModelTokenStatsDoc = Infer<typeof ModelTokenStats.doc>
export type ModelTokenStats = WithoutSystemFields<ModelTokenStatsDoc>
