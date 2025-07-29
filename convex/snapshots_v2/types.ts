import type { ZodSafeParseResult } from 'zod/v4'
import type { ActionCtx } from '../_generated/server'

// A Source declares how to retrieve and transform a piece of data
export interface Source<T> {
  // Get transformed data - could be from remote API or stored file
  retrieve: () => Promise<ZodSafeParseResult<T>[]>
}

// Sources type will be inferred from createSources return

// Output handlers - simple functions that write arrays of items
export type Outputs = Record<string, (items: any[]) => Promise<void>>

// Run configuration
export interface RunConfig {
  run_id: string
  snapshot_at: number
  sources: 'remote' | 'archive'
}

// Official context object passed to processes (Sources type will be inferred)
export interface ProcessContext<TSources = any> {
  config: RunConfig
  sources: TSources
  outputs: Outputs
  ctx: ActionCtx
}
