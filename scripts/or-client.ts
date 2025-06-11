import { z } from 'zod'
import { openrouter } from '../convex/openrouter/client'
import { OpenRouterFrontendModelRecordSchema } from '@/convex/openrouter/schemas/api_frontend_models'
import { pick } from 'convex-helpers'

const DataResponseSchema = z.object({
  success: z.literal(true),
  data: z
    .unknown()
    .array()
    .transform((v) => {
      return v.slice(0, 2)
    }),
})

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    type: z.string(),
    message: z.string(),
    status: z.number().optional(),
    code: z.number().optional(),
    details: z
      .unknown()
      .transform((v) => {
        if (typeof v === 'string' && v.length > 100) {
          return v.slice(0, 100) + '...'
        }
        return v
      })
      .optional(),
  }),
})

async function fetchModels() {
  const result = await openrouter.frontend.models()
  if (!result.success) throw new Error(result.error.message)
  const models = OpenRouterFrontendModelRecordSchema.extend({
    endpoint: z.object({ variant: z.string() }).nullable(),
  })
    .array()
    .parse(result.data)

  // const deepseek = models.filter((m) => m.slug.startsWith('deepseek'))
  // Bun.write('./deepseek.json', JSON.stringify(deepseek, null, 2))

  const mvss = models.map((m) => m.slug + ':' + getVariant(m.endpoint?.variant))
  const set = new Set<string>()

  for (const mvs of mvss) {
    if (set.has(mvs)) console.log(mvs)
    set.add(mvs)
  }

  console.log(set.values().toArray().sort())
}

await fetchModels()

function getVariant(input?: string) {
  if (!input || input === 'standard') return ''
  return input
}
