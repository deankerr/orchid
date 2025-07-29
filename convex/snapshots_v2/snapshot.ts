import type { ActionCtx } from '../_generated/server'
import { standard } from './processes/standard'
import { createSources, type Sources } from './sources'
import type { Outputs, ProcessContext, RunConfig } from './types'

// Create official context object
function createProcessContext(ctx: ActionCtx, config: RunConfig): ProcessContext<Sources> {
  // Create sources using unified function
  const sources = createSources(ctx, config)

  // Create dummy output handlers for now
  const outputs: Outputs = {
    models: async (items: any[]) => {
      console.log(`📝 Would write ${items.length} models to database`)
      // TODO: actual database writes
    },
    endpoints: async (items: any[]) => {
      console.log(`📝 Would write ${items.length} endpoints to database`)
      // TODO: actual database writes
    },
  }

  return {
    config,
    sources,
    outputs,
    ctx,
  }
}

export async function runSnapshot(ctx: ActionCtx, config: RunConfig) {
  console.log(`🚀 Starting snapshot run: ${config.run_id} (${config.sources})`)

  // Create official context
  const processCtx = createProcessContext(ctx, config)

  // Run standard process
  const results = await standard(processCtx)

  console.log(`✅ Snapshot completed: ${results.models} models, ${results.endpoints} endpoints`)

  return results
}
