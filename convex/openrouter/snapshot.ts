import { v } from 'convex/values'

import { internalAction, internalMutation } from '../_generated/server'
import { Table2 } from '../table2'
import { orchestrator } from './orchestrator'

export const SnapshotRuns = Table2('snapshot_runs', {
  snapshot_at: v.number(),
  started_at: v.number(),
  ended_at: v.optional(v.number()),
  ok: v.boolean(),
  pipelines: v.array(
    v.object({
      name: v.string(),
      ok: v.boolean(),
      error: v.optional(v.string()),
      metrics: v.optional(v.any()),
    }),
  ),
})

export const insertRun = internalMutation({
  args: {
    snapshot_at: v.number(),
    started_at: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert(SnapshotRuns.name, {
      ...args,
      ok: true,
      pipelines: [],
    })
  },
})

export const updateRun = internalMutation({
  args: {
    run_id: v.id(SnapshotRuns.name),
    ended_at: v.number(),
    ok: v.boolean(),
    pipelines: v.array(
      v.object({
        name: v.string(),
        ok: v.boolean(),
        error: v.optional(v.string()),
        metrics: v.optional(v.any()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { run_id, ...updates } = args
    await ctx.db.patch(run_id, updates)
  },
})

export const run = internalAction({
  handler: orchestrator,
})
