import { internal } from '../_generated/api'
import { internalQuery, type ActionCtx } from '../_generated/server'
import { ConvexWriter, type OutputHandler } from './output'
import { createSources } from './sources'
import type { RunConfig } from './types'
import { createValidator } from './validation'

export type ProcessContext = Awaited<ReturnType<typeof createProcessContext>>

export interface ProcessContextConfig {
  handlers?: OutputHandler[]
}

export async function createProcessContext(
  ctx: ActionCtx,
  config: RunConfig,
  options: ProcessContextConfig = {},
) {
  const validator = createValidator()
  const sources = await createSources({ ctx, config, validator })

  // Create output handlers
  const handlers = options.handlers ?? [new ConvexWriter(ctx)]
  const outputs = createOutputs(handlers)

  const state = createState(ctx)

  return {
    config,
    sources,
    outputs,
    validator,
    state,
  }
}

// * Output handler orchestration
function createOutputs(handlers: OutputHandler[]) {
  return {
    write: async (item: Parameters<OutputHandler['write']>[0]) => {
      await Promise.all(handlers.map((handler) => handler.write(item)))
    },
    finish: async () => {
      await Promise.all(handlers.map((handler) => handler.finish?.()))
    },
  }
}

// * state
export const collectExistingModels = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query('or_models').collect()
  },
})

export const collectExistingEndpoints = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query('or_endpoints').collect()
  },
})

function createState(ctx: ActionCtx) {
  return {
    existingModels: async () =>
      await ctx.runQuery(internal.snapshots_v2.context.collectExistingModels),
    existingEndpoints: async () =>
      await ctx.runQuery(internal.snapshots_v2.context.collectExistingEndpoints),
  }
}
