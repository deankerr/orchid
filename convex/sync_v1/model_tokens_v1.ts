import { defineTable } from 'convex/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'
import { z } from 'zod'
import type { MutationCtx } from '../_generated/server'

export const modelTokensTable = defineTable({
  model_permaslug: v.string(),
  model_variant: v.string(),
  timestamp: v.number(),
  input_tokens: v.number(),
  output_tokens: v.number(),
  reasoning_tokens: v.number(),
  request_count: v.number(),
}).index('by_model_permaslug_model_variant_timestamp', ['model_permaslug', 'model_variant', 'timestamp'])

export const vModelTokensFields = modelTokensTable.validator.fields

const OpenRouterModelsWithStatsSchema = z.object({
  modelsWithStats: z
    .object({
      stats: z
        .object({
          model_permaslug: z.string(),
          variant: z.string(),
          date: z.string(),
          total_completion_tokens: z.number(),
          total_prompt_tokens: z.number(),
          total_native_tokens_reasoning: z.number(),
          count: z.number(),
        })
        .array(),
    })
    .array(),
})

export function parseModelWithStatsRecords(records: unknown) {
  const parsed = OpenRouterModelsWithStatsSchema.parse(records)

  return parsed.modelsWithStats.flatMap((model) =>
    model.stats.map((stat) => ({
      model_permaslug: stat.model_permaslug,
      model_variant: stat.variant,
      timestamp: new Date(stat.date).getTime(),
      input_tokens: stat.total_prompt_tokens,
      output_tokens: stat.total_completion_tokens,
      reasoning_tokens: stat.total_native_tokens_reasoning,
      request_count: stat.count,
    })),
  )
}

export async function mergeModelTokensStats(
  ctx: MutationCtx,
  modelTokensStats: Infer<AsObjectValidator<typeof vModelTokensFields>>[],
) {
  // stats come mixed up from the API, group them here
  const mapByPermaslugVariant = Map.groupBy(
    modelTokensStats,
    (stat) => stat.model_permaslug + ' ' + stat.model_variant,
  )

  for (const [key, stats] of mapByPermaslugVariant) {
    if (stats.length === 0) continue
    const [model_permaslug, model_variant] = key.split(' ')

    // sort by earliest -> latest
    stats.sort((a, b) => a.timestamp - b.timestamp)
    const earliestTimestamp = stats[0].timestamp
    const latestTimestamp = stats[stats.length - 1].timestamp

    const existingStats = await ctx.db
      .query('model_tokens_v1')
      .withIndex('by_model_permaslug_model_variant_timestamp', (q) =>
        q
          .eq('model_permaslug', model_permaslug)
          .eq('model_variant', model_variant)
          .gte('timestamp', earliestTimestamp)
          .lte('timestamp', latestTimestamp),
      )
      .collect()

    for (const stat of stats) {
      // there can only by 0 or 1
      const existingStat = existingStats.find((s) => s.timestamp === stat.timestamp)

      if (!existingStat) {
        // if no existing stat, insert and continue
        await ctx.db.insert('model_tokens_v1', {
          model_permaslug,
          model_variant,
          timestamp: stat.timestamp,
          input_tokens: stat.input_tokens,
          output_tokens: stat.output_tokens,
          reasoning_tokens: stat.reasoning_tokens,
          request_count: stat.request_count,
        })
        continue
      }

      // skip identical stat
      if (
        existingStat.input_tokens === stat.input_tokens &&
        existingStat.output_tokens === stat.output_tokens &&
        existingStat.reasoning_tokens === stat.reasoning_tokens &&
        existingStat.request_count === stat.request_count
      ) {
        continue
      }

      // replace existing stat with updated data
      await ctx.db.replace(existingStat._id, stat)
    }
  }
}
