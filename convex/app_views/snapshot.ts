import z4 from 'zod/v4'
import { orFetch } from '../openrouter/client'
import type { AppView } from './table'
import { AppStrictSchema, AppTransformSchema } from './schemas'
import type { AppTokenStats } from '../app_token_stats/table'

export async function snapshot({
  slug,
  permaslug,
  variant,
  epoch,
}: {
  slug: string
  permaslug: string
  variant: string
  epoch: number
}) {
  const result = await orFetch('/api/frontend/stats/app', {
    params: {
      permaslug,
      variant,
      limit: 20,
    },
    schema: z4.object({
      data: z4.unknown().array(),
    }),
  })

  const apps: AppView[] = []
  const appTokens: AppTokenStats[] = []

  const transform: { index: number; error: z4.ZodError }[] = []
  const strict: { index: number; error: z4.ZodError }[] = []

  for (const [index, record] of result.data.entries()) {
    const r1 = AppTransformSchema.safeParse(record)
    if (r1.success) {
      apps.push({
        ...r1.data.app,
        epoch,
      })

      appTokens.push({
        ...r1.data.appTokens,
        model_permaslug: permaslug,
        model_slug: slug,
        model_variant: variant,
        epoch,
      })
    } else {
      transform.push({ index, error: r1.error })
    }

    const r2 = AppStrictSchema.safeParse(record)
    if (!r2.success) {
      strict.push({ index, error: r2.error })
    }
  }

  return { apps, appTokens, issues: { transform, strict } }
}
