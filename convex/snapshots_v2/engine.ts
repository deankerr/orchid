import { v } from 'convex/values'

import { api, internal } from '../_generated/api'
import { internalAction, type ActionCtx } from '../_generated/server'
import { getHourAlignedTimestamp } from '../shared'
import type { EntityMetric } from './comparison/decision'
import { createInputs } from './inputs'
import { ConvexWriter, LogWriter } from './outputs'
import { standard } from './processes/standard_v2'
import type { ProcessContext, RunConfig, State } from './types'

// * Run report types
export interface RunReport {
  startedAt: number
  endedAt: number
  durationMs: number
  metrics: EntityMetric[]
  issues: number // validation issues (process continues despite these)
  // TODO: Add errors: ProcessError[] for actual process failures that stop execution
}

// * Create state object for querying existing data
function createState(ctx: ActionCtx): State {
  return {
    models: async () => {
      return await ctx.runQuery(api.public.models.list, {})
    },
    endpoints: async () => {
      return await ctx.runQuery(api.public.endpoints.list, {})
    },
  }
}

// * Main snapshot engine - fully integrated with new architecture
export async function run(ctx: ActionCtx, config: RunConfig): Promise<RunReport> {
  const startedAt = Date.now()

  console.log(
    `🚀 Starting snapshot engine: ${config.run_id} (${config.replay_from ? 'archive' : 'remote'}, ${config.outputMethod})`,
  )

  // * Step 1: Build sub-systems
  const { inputs, filter } = createInputs(ctx, config)

  // Create appropriate output handler based on config
  const outputs = config.outputMethod === 'log-writer' ? new LogWriter() : new ConvexWriter(ctx)
  const state = createState(ctx)

  // Initialize outputs
  await outputs.init?.()

  // * Step 2: Run Process
  const processCtx: ProcessContext = {
    sources: inputs,
    outputs,
    state,
    config,
  }

  const results = await standard(processCtx)

  // * Step 3: Flush outputs
  await outputs.finish?.()

  const endedAt = Date.now()
  const durationMs = endedAt - startedAt

  // * Step 4: Assemble RunReport
  const issues = filter.issues()
  if (issues.length > 0) {
    console.log(
      `⚠️  ${issues.length} validation issues collected:`,
      issues.reduce(
        (acc, issue) => {
          acc[issue.source] = (acc[issue.source] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    )
  }

  console.log(
    `✅ Snapshot engine completed: ${results.models} models, ${results.endpoints} endpoints`,
  )

  return {
    startedAt,
    endedAt,
    durationMs,
    metrics: results.metrics,
    issues: issues.length,
  }
}

// * Demo action to run the snapshot engine
export const runDemo = internalAction({
  args: {
    inputMethod: v.union(v.literal('remote'), v.literal('remote-no-store'), v.literal('archive')),
    outputMethod: v.union(v.literal('log-writer'), v.literal('convex-writer')),
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

    // Create a new snapshot run record
    const run_id = await ctx.runMutation(internal.openrouter.output.insertSnapshotRun, {
      snapshot_at,
      started_at: Date.now(),
    })

    const config: RunConfig = {
      run_id,
      snapshot_at,
      inputMethod: args.inputMethod,
      outputMethod: args.outputMethod,
      replay_from: args.replay_from,
    }

    // Run the snapshot engine
    const report = await run(ctx, config)

    // Update run status with results
    await ctx.runMutation(internal.openrouter.output.updateSnapshotRun, {
      run_id,
      ended_at: report.endedAt,
      ok: true,
      // NOTE: adapt v2 results to v1 pipelines format
      pipelines: [
        {
          name: 'standard-models',
          error: undefined,
          metrics: {
            entities: report.metrics,
          },
          ok: report.issues === 0,
        },
      ],
    })

    console.log(`🎯 Demo completed: ${report.durationMs}ms, ${report.issues} validation issues`)

    // NOTE: DO NOT RETURN ANYTHING per CLAUDE.md rules
  },
})
