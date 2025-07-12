import { v } from 'convex/values'

import { internalAction, internalMutation, query, type QueryCtx } from '../_generated/server'
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
    return await ctx.db.insert('snapshot_runs', {
      ...args,
      ok: true,
      pipelines: [],
    })
  },
})

export const updateRun = internalMutation({
  args: {
    run_id: v.id('snapshot_runs'),
    ended_at: v.number(),
    ok: v.boolean(),
    pipelines: v.array(
      v.object({
        name: v.string(),
        ok: v.boolean(),
        error: v.optional(v.string()),
        metrics: v.optional(v.record(v.string(), v.any())),
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

// * queries
export async function getCurrentSnapshotTimestamp(ctx: QueryCtx) {
  const latestRun = await ctx.db
    .query('snapshot_runs')
    .order('desc')
    .filter((q) => q.neq(q.field('ended_at'), undefined))
    .first()
  return latestRun?.snapshot_at ?? 0
}

export const getSnapshotStatus = query({
  handler: async (ctx) => {
    const latestRun = await ctx.db.query('snapshot_runs').order('desc').first()

    if (!latestRun) {
      return { status: 'unknown' as const, snapshot_at: null }
    }

    const isInProgress = !latestRun.ended_at
    const hasError = !latestRun.ok
    const hasIssues = latestRun.pipelines.some((p) => p.metrics?.issues?.length)

    if (isInProgress) {
      return { status: 'in_progress' as const, snapshot_at: latestRun.snapshot_at }
    }

    if (hasError) {
      return { status: 'error' as const, snapshot_at: latestRun.snapshot_at }
    }

    if (hasIssues) {
      return { status: 'issues' as const, snapshot_at: latestRun.snapshot_at }
    }

    return { status: 'ok' as const, snapshot_at: latestRun.snapshot_at }
  },
})

export const getSnapshotRuns = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 50 }) => {
    const runs = await ctx.db.query('snapshot_runs').order('desc').take(limit)
    return runs
  },
})

export const getSnapshotArchives = query({
  args: {
    snapshot_at: v.number(),
  },
  handler: async (ctx, { snapshot_at }) => {
    const archives = await ctx.db
      .query('snapshot_archives')
      .withIndex('by_snapshot_at', (q) => q.eq('snapshot_at', snapshot_at))
      .order('desc')
      .collect()

    return archives
  },
})
