import { type ActionCtx } from '../_generated/server'
import { outputToDB } from './output'
import { createRemoteSources } from './sources'
import type { RunConfig } from './types'
import { createValidator } from './validation'

export type ProcessContext = ReturnType<typeof createProcessContext>
export function createProcessContext(ctx: ActionCtx, config: RunConfig) {
  const validator = createValidator()
  const sources = createRemoteSources({ ctx, config, validator })
  const outputs = outputToDB(ctx)

  return {
    config,
    sources,
    outputs,
    ctx,
    validator,
  }
}
