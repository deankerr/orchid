import { internalAction, type ActionCtx } from '../_generated/server'
import { createProcessContext } from './context'
import { standard } from './processes/standard'
import type { RunConfig } from './types'

export async function runSnapshot(ctx: ActionCtx, config: RunConfig) {
  console.log(`🚀 Starting snapshot run: ${config.run_id} (${config.sources})`)

  const processCtx = createProcessContext(ctx, config)

  const results = await standard(processCtx)

  // Log error summary
  const errors = processCtx.validator.getErrors()
  if (errors.length > 0) {
    console.log(
      `⚠️  ${errors.length} parsing errors collected:`,
      errors.reduce(
        (acc, e) => {
          acc[e.source] = (acc[e.source] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    )
  }

  console.log(`✅ Snapshot completed: ${results.models} models, ${results.endpoints} endpoints`)

  return { ...results, errors: errors.length }
}

export const runDemo = internalAction({
  handler: async (ctx) => {
    const config: RunConfig = {
      run_id: Date.now().toString(),
      snapshot_at: Date.now(),
      sources: 'remote',
    }

    return await runSnapshot(ctx, config)
  },
})
