import * as R from 'remeda'
import { z } from 'zod'

const author = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    icon_uri: z.null(),
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

const modelsWithStats = z
  .object({
    slug: z.string(),
    permaslug: z.string(),
    stats: z
      .object({
        model_permaslug: z.string(),
        variant: z.string(),
        date: z.string(),
        total_completion_tokens: z.number(),
        total_prompt_tokens: z.number(),
        total_native_tokens_reasoning: z.number(),
        variant_permaslug: z.string(),
        count: z.number(),
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

export const modelAuthor = z.object({ author, modelsWithStats })
