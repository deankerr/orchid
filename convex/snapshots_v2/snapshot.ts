import { v } from 'convex/values'

import { internal } from '../_generated/api'
import { internalAction, type ActionCtx } from '../_generated/server'
import { getHourAlignedTimestamp } from '../shared'
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
    // NOTE: using v1 system for now
    const snapshot_at = getHourAlignedTimestamp()
    const run_id = await ctx.runMutation(internal.openrouter.output.insertSnapshotRun, {
      snapshot_at,
      started_at: Date.now(),
    })

    const config: RunConfig = {
      run_id,
      snapshot_at,
      sources: 'remote',
    }

    const results = await runSnapshot(ctx, config)

    // NOTE: temp results
    await ctx.runMutation(internal.openrouter.output.updateSnapshotRun, {
      run_id,
      ended_at: Date.now(),
      ok: true,
      pipelines: [],
    })

    return results
  },
})

export const runArchiveDemo = internalAction({
  args: {
    snapshot_at: v.number(),
    run_id: v.id('snapshot_runs'),
  },
  handler: async (ctx, { snapshot_at, run_id }) => {
    // NOTE: using v1 system for now

    const config: RunConfig = {
      run_id,
      snapshot_at,
      sources: 'archive',
    }

    const results = await runSnapshot(ctx, config)

    // NOTE: temp results
    await ctx.runMutation(internal.openrouter.output.updateSnapshotRun, {
      run_id,
      ended_at: Date.now(),
      ok: true,
      pipelines: [],
    })

    return results
  },
})
