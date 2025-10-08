import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'
import * as R from 'remeda'

import { TableAggregate } from '@convex-dev/aggregate'
import { diff } from 'json-diff-ts'

import { components } from '../../_generated/api'
import { DataModel, Doc } from '../../_generated/dataModel'
import { internalMutation, MutationCtx, query } from '../../_generated/server'
import { createTableVHelper } from '../../lib/vTable'

// Daily stats for each model

// -> view stats for each day
// -> view stats for a model across time

// -> charts/visualisations

export const table = defineTable({
  // timestamp + slug = unique key
  timestamp: v.number(), // 0:00 UTC, daily
  slug: v.string(),

  base_slug: v.string(),
  version_slug: v.string(),
  variant: v.string(),

  count: v.number(),
  total_output_tokens: v.number(),
  total_input_tokens: v.number(),
  total_native_tokens_reasoning: v.number(),
  num_media_input: v.number(),
  num_media_output: v.number(),
  total_native_tokens_cached: v.number(),
  total_tool_calls: v.number(),

  date: v.string(), // ? unreliable, repeated across many days
})
  .index('by_timestamp', ['timestamp'])
  .index('by_slug__timestamp', ['slug', 'timestamp'])

export const vTable = createTableVHelper('or_stats', table.validator)

const statsByTime = new TableAggregate<{
  Key: number
  DataModel: DataModel
  TableName: 'or_stats'
}>(components.aggregateModelStatsByTime, {
  sortKey: (doc) => doc.timestamp,
})

async function insertDoc(ctx: MutationCtx, { fields }: { fields: typeof vTable.validator.type }) {
  const id = await ctx.db.insert('or_stats', fields)
  const doc = await ctx.db.get(id)
  await statsByTime.insert(ctx, doc!)
}

async function replaceDoc(
  ctx: MutationCtx,
  { oldDoc, fields }: { oldDoc: Doc<'or_stats'>; fields: typeof vTable.validator.type },
) {
  await ctx.db.replace(oldDoc._id, fields)
  const newDoc = await ctx.db.get(oldDoc._id)
  await statsByTime.replace(ctx, oldDoc, newDoc!)
}

export const upsert = internalMutation({
  args: {
    stats: v.array(vTable.validator),
  },
  handler: async (ctx, args) => {
    const results = await asyncMap(args.stats, async (fields) => {
      const oldDoc = await ctx.db
        .query(vTable.name)
        .withIndex('by_slug__timestamp', (q) =>
          q.eq('slug', fields.slug).eq('timestamp', fields.timestamp),
        )
        .first()

      if (!oldDoc) {
        await insertDoc(ctx, { fields })
        return 'insert'
      } else {
        const diffResults = diff(oldDoc, fields, { keysToSkip: ['_id', '_creationTime'] })
        if (!diffResults.length) return 'stable'

        await replaceDoc(ctx, { oldDoc, fields })
        return 'replace'
      }
    })

    return R.countBy(results, (r) => r)
  },
})

// Query to get all unique timestamps (days) with stats
export const getUniqueDays = query({
  args: {},
  returns: v.array(v.number()),
  handler: async (ctx) => {
    const days: number[] = []

    // Use pagination to iterate through all stats and collect unique timestamps
    for await (const item of statsByTime.iter(ctx, {
      order: 'asc',
      pageSize: 1000, // Large page size for efficiency
    })) {
      if (!days.includes(item.key)) {
        days.push(item.key)
      }
    }

    return days.sort((a, b) => b - a) // Most recent first
  },
})

// Query to get all stats for a specific day
export const getStatsForDay = query({
  args: {
    timestamp: v.number(),
  },
  returns: v.array(vTable.doc),
  handler: async (ctx, args) => {
    // Get all stats for the specific day
    const stats = await ctx.db
      .query('or_stats')
      .withIndex('by_timestamp', (q) => q.eq('timestamp', args.timestamp))
      .collect()

    return stats
  },
})

// Query to get aggregated stats for a specific day using the aggregate
export const getAggregatedStatsForDay = query({
  args: {
    timestamp: v.number(),
  },
  returns: v.object({
    totalRequests: v.number(),
    totalOutputTokens: v.number(),
    totalInputTokens: v.number(),
    totalReasoningTokens: v.number(),
    totalCachedTokens: v.number(),
    totalMediaInput: v.number(),
    totalMediaOutput: v.number(),
    totalToolCalls: v.number(),
    modelCount: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get individual stats to calculate all metrics
    const dayStats = await ctx.db
      .query('or_stats')
      .withIndex('by_timestamp', (q) => q.eq('timestamp', args.timestamp))
      .collect()

    if (dayStats.length === 0) {
      return {
        totalRequests: 0,
        totalOutputTokens: 0,
        totalInputTokens: 0,
        totalReasoningTokens: 0,
        totalCachedTokens: 0,
        totalMediaInput: 0,
        totalMediaOutput: 0,
        totalToolCalls: 0,
        modelCount: 0,
      }
    }

    // Aggregate all the stats for the day
    const totalRequests = dayStats.reduce((sum, stat) => sum + stat.count, 0)
    const totalOutputTokens = dayStats.reduce((sum, stat) => sum + stat.total_output_tokens, 0)
    const totalInputTokens = dayStats.reduce((sum, stat) => sum + stat.total_input_tokens, 0)
    const totalReasoningTokens = dayStats.reduce(
      (sum, stat) => sum + stat.total_native_tokens_reasoning,
      0,
    )
    const totalCachedTokens = dayStats.reduce(
      (sum, stat) => sum + stat.total_native_tokens_cached,
      0,
    )
    const totalMediaInput = dayStats.reduce((sum, stat) => sum + stat.num_media_input, 0)
    const totalMediaOutput = dayStats.reduce((sum, stat) => sum + stat.num_media_output, 0)
    const totalToolCalls = dayStats.reduce((sum, stat) => sum + stat.total_tool_calls, 0)
    const modelCount = new Set(dayStats.map((stat) => `${stat.version_slug}:${stat.variant}`)).size

    return {
      totalRequests,
      totalOutputTokens,
      totalInputTokens,
      totalReasoningTokens,
      totalCachedTokens,
      totalMediaInput,
      totalMediaOutput,
      totalToolCalls,
      modelCount,
    }
  },
})

export const dev_clear_statsByTime = internalMutation({
  args: {},
  handler: async (ctx) => {
    await statsByTime.clearAll(ctx)
  },
})
