import { internalAction } from '../_generated/server'
import { orchestrator } from './orchestrator'

export const run = internalAction({
  handler: orchestrator,
})
