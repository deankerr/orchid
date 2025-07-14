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
        stats: z4.object(statsFields).array(),
      })
      .array(),
  })
  .transform(({ modelsWithStats }) =>
    modelsWithStats.flatMap((model) =>
      model.stats.map((stat) => ({
        model_slug: model.slug,
        model_permaslug: stat.model_permaslug,
        model_variant: stat.variant,
        timestamp: new Date(stat.date).getTime(),
        input_tokens: stat.total_prompt_tokens,
        output_tokens: stat.total_completion_tokens,
        reasoning_tokens: stat.total_native_tokens_reasoning,
        request_count: stat.count,
      })),
    ),
  )
