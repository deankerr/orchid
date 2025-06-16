import z4 from 'zod/v4'
import { orFetch } from '../openrouter/client'
import { validateArray } from '../openrouter/validation'
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

  const { items, issues } = validateArray(result.data, AppTransformSchema, AppStrictSchema, (parsed) => ({
    app: {
      ...parsed.app,
      epoch,
    },
    appTokens: {
      ...parsed.appTokens,
      model_permaslug: permaslug,
      model_slug: slug,
      model_variant: variant,
      epoch,
    },
  }))

  const apps: AppView[] = []
  const appTokens: AppTokenStats[] = []

  for (const item of items) {
    apps.push(item.app)
    appTokens.push(item.appTokens)
  }

  return { apps, appTokens, issues }
}
