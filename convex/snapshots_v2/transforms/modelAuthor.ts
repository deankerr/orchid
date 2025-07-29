import * as R from 'remeda'
import z4 from 'zod/v4'

export const author = z4
  .object({
    id: z4.string(),
    slug: z4.string(),
    name: z4.string(),
    description: z4.string().nullable(),
    created_at: z4.string(),
    updated_at: z4.string(),
    icon_uri: z4.null(),
  })
  .transform(R.pickBy(R.isNonNullish))
  .transform((data) => {
    const { id, created_at, updated_at, ...rest } = data

    return {
      ...rest,
      uuid: id,
      or_created_at: new Date(created_at).getTime(),
      or_updated_at: new Date(updated_at).getTime(),
    }
  })

export const modelsWithStats = z4
  .object({
    slug: z4.string(),
    permaslug: z4.string(),
    stats: z4
      .object({
        model_permaslug: z4.string(),
        variant: z4.string(),
        date: z4.string(),
        total_completion_tokens: z4.number(),
        total_prompt_tokens: z4.number(),
        total_native_tokens_reasoning: z4.number(),
        variant_permaslug: z4.string(),
        count: z4.number(),
      })
      .array(),
  })
  .array()
  .transform((modelsWithStats) => {
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

export const modelAuthor = z4.object({ author, modelsWithStats })
