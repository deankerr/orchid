import type { z } from 'zod/v4'

import type { Doc } from '../_generated/dataModel'
import type { DecisionOutcome } from './comparison/decision'
import type { InputMap } from './inputs'
import { apps } from './sources/apps'
import { endpoints } from './sources/endpoints'
import { modelAuthor } from './sources/modelAuthor'
import { models } from './sources/models'
import { providers } from './sources/providers'
import { uptimes } from './sources/uptimes'

// Removed validator import - no longer needed

// Transform result types - inferred from our transform schemas
export type TransformTypes = {
  models: z.infer<typeof models>
  endpoints: z.infer<typeof endpoints>
  apps: z.infer<typeof apps>
  providers: z.infer<typeof providers>
  uptimes: z.infer<typeof uptimes>
  modelAuthor: z.infer<typeof modelAuthor>
}

// Input modes - how data is sourced
export type InputMode = 'remote' | 'remote-no-store' | 'archive'

// Run configuration
export interface RunConfig {
  run_id: string
  snapshot_at: number
  inputMethod: InputMode
  outputMethod: 'log-writer' | 'convex-writer'

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
  sources: InputMap
  outputs: Outputs
  state: State
  config: RunConfig
}
