import type { z } from 'zod/v4'

import type { Doc } from '../_generated/dataModel'
import type { DecisionOutcome } from './comparison/decision'
import type { Sources } from './sources'
import { apps } from './transforms/apps'
import { endpoints } from './transforms/endpoints'
import { modelAuthor } from './transforms/modelAuthor'
import { models } from './transforms/models'
import { providers } from './transforms/providers'
import { uptimes } from './transforms/uptimes'
import type { Validator } from './validation/validator'

// Transform result types - inferred from our transform schemas
export type TransformTypes = {
  models: z.infer<typeof models>
  endpoints: z.infer<typeof endpoints>
  apps: z.infer<typeof apps>
  providers: z.infer<typeof providers>
  uptimes: z.infer<typeof uptimes>
  modelAuthor: z.infer<typeof modelAuthor>
}

// Run configuration
export interface RunConfig {
  run_id: string
  snapshot_at: number
  output: 'log-writer' | 'convex-writer'

  // If present, replay from this archived run instead of fetching live data
  replay_from?: {
    run_id: string
    snapshot_at: number
  }
}

// State interface for existing data queries
export interface State {
  models(): Promise<Doc<'or_models'>[]>
  endpoints(): Promise<Doc<'or_endpoints'>[]>
}

// Output handler interface for writing decisions
export interface Outputs {
  init?(): Promise<void>
  write(item: DecisionOutcome): Promise<void>
  finish?(): Promise<void>
}

// Central ProcessContext definition - used by all processes
export interface ProcessContext {
  sources: Sources
  validator: Validator
  outputs: Outputs
  state: State
  config: RunConfig
}
