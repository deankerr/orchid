import { v } from 'convex/values'

import { internal } from '../_generated/api'
import { internalAction, type ActionCtx } from '../_generated/server'
import { getHourAlignedTimestamp } from '../shared'
import { createProcessContext } from './context'
import { ConvexWriter, LogWriter } from './output'
import { standard } from './processes/standard'
import type { RunConfig } from './types'

export async function runSnapshot(ctx: ActionCtx, config: RunConfig) {
  const sourceType = config.replay_from ? 'archive' : 'remote'
  console.log(`🚀 Starting snapshot run: ${config.run_id} (${sourceType}, ${config.output})`)

  // Create appropriate output handler based on config
  const handlers = config.output === 'log-writer' ? [new LogWriter()] : [new ConvexWriter(ctx)]

  const processCtx = await createProcessContext(ctx, config, { handlers })

  const results = await standard(processCtx)

  // Finish all output handlers
  await processCtx.outputs.finish()

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
  args: {
    output: v.optional(v.union(v.literal('log-writer'), v.literal('convex-writer'))),
    snapshot_at: v.optional(v.number()),

    // For archive replay - specify which archived run to replay from
    replay_from: v.optional(
      v.object({
        run_id: v.id('snapshot_runs'),
        snapshot_at: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Use provided values or defaults
    const snapshot_at = args.snapshot_at ?? getHourAlignedTimestamp()
    const output = args.output ?? 'convex-writer'

    const run_id = await ctx.runMutation(internal.openrouter.output.insertSnapshotRun, {
      snapshot_at,
      started_at: Date.now(),
    })

    // TODO: run doc should record config
    const config: RunConfig = {
      run_id,
      snapshot_at,
      output,
      replay_from: args.replay_from,
    }

    const results = await runSnapshot(ctx, config)

    // Update run status (only if we created the run)
    await ctx.runMutation(internal.openrouter.output.updateSnapshotRun, {
      run_id,
      ended_at: Date.now(),
      ok: true,
      // NOTE: adapt v2 results to v1 pipelines format
      pipelines: [
        {
          name: 'standard-models',
          error: undefined,
          metrics: {
            entities: [results.metrics['or_models'], results.metrics['or_endpoints']],
          },
          ok: true,
        },
      ],
    })

    // NOTE: DO NOT RETURN ANYTHING
  },
})
