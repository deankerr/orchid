import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import type { QueryCtx } from '../../_generated/server'
import { fnMutationLite, fnQueryLite } from '../../fnHelperLite'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
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

export const vTable = createTableVHelper('snapshot_runs', table.validator)

// * queries
export const getLatest = fnQueryLite({
  handler: async (ctx) => {
    return await ctx.db.query(vTable.name).order('desc').first()
  },
})

export const getStatus = fnQueryLite({
  handler: async (ctx) => {
    const latestRun = await ctx.db.query(vTable.name).order('desc').first()

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

export const list = fnQueryLite({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    return await ctx.db.query(vTable.name).order('desc').take(limit)
  },
})

// * mutations
export const insert = fnMutationLite({
  args: {
    snapshot_at: v.number(),
    started_at: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert(vTable.name, {
      ...args,
      ok: true,
      pipelines: [],
    })
  },
})

export const update = fnMutationLite({
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

// Legacy names for backward compatibility
export const insertRun = insert
export const updateRun = update

// * utility functions
export async function getCurrentSnapshotTimestamp(ctx: QueryCtx) {
  const latestRun = await ctx.db
    .query(vTable.name)
    .order('desc')
    .filter((q) => q.and(q.neq(q.field('ended_at'), undefined), q.eq(q.field('ok'), true)))
    .first()
  return latestRun?.snapshot_at ?? 0
}
