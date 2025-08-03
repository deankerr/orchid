import type { z } from 'zod/v4'

import type { Doc, Id } from '../_generated/dataModel'
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
  models: z.infer<typeof models.schema>
  endpoints: z.infer<typeof endpoints.schema>
  apps: z.infer<typeof apps.schema>
  providers: z.infer<typeof providers.schema>
  uptimes: z.infer<typeof uptimes.schema>
  modelAuthor: z.infer<typeof modelAuthor.schema>
}

// Run configuration
export interface RunConfig {
  run_id: string
  snapshot_at: number

  replay?: Id<'snapshot_runs'>
  outputType: 'log' | 'db'
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
