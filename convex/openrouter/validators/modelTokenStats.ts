import z4 from 'zod/v4'

const statsFields = {
  model_permaslug: z4.string(),
  variant: z4.string(),
  date: z4.string(),
  total_completion_tokens: z4.number(),
  total_prompt_tokens: z4.number(),
  total_native_tokens_reasoning: z4.number(),
  variant_permaslug: z4.string(),
  count: z4.number(),
}

export const ModelTokenStatsStrictSchema = z4.strictObject({
  modelsWithStats: z4
    .object({
      slug: z4.string(),
      permaslug: z4.string(),
      stats: z4.strictObject(statsFields).array(),
    })
    .array(),
  author: z4.unknown(), // checked in author_views
})

export const ModelTokenStatsTransformSchema = z4
  .object({
    modelsWithStats: z4
      .object({
        slug: z4.string(),
        permaslug: z4.string(),
        stats: z4.object(statsFields).array(),
      })
      .array(),
  })
  .transform(({ modelsWithStats }) => {
    return modelsWithStats.flatMap((model) => {
      const byVariant = Map.groupBy(model.stats, (m) => m.variant)
      return [...byVariant].map(([variant, stats]) => {
        return {
          model_slug: model.slug,
          model_permaslug: model.permaslug,
          model_variant: variant,
          stats: stats
            .map((s) => ({
              timestamp: new Date(s.date).getTime(),
              input: s.total_prompt_tokens,
              output: s.total_completion_tokens,
              reasoning: s.total_native_tokens_reasoning,
              requests: s.count,
            }))
            .slice(0, 90)
            .reverse(),
        }
      })
    })
  })
