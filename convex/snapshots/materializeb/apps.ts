import type { Infer } from 'convex/values'
import type z4 from 'zod/v4'

import * as DB from '@/convex/db'

import { internal } from '../../_generated/api'
import { type ActionCtx } from '../../_generated/server'
import type { CrawlArchiveBundle } from '../crawlB'
import * as Transforms from '../transforms'

export async function calculateAppsFromBundle(
  ctx: ActionCtx,
  bundle: CrawlArchiveBundle,
  snapshot_at: number,
) {
  const appsMap = new Map<number, Infer<typeof DB.OrApps.vTable.validator>>()
  const modelAppLeaderboards: Infer<typeof DB.OrModelAppLeaderboards.vTable.validator>[] = []
  const issues: { source: string; error: z4.ZodError }[] = []

  // Process apps per bundle model entry (per OpenRouter model-variant)
  for (const entry of bundle.data.models) {
    const permaslug = entry.model.permaslug
    const variant = entry.model.endpoint?.variant
    if (!permaslug || !variant) continue

    const validApps: Array<ReturnType<typeof Transforms.apps.parse>> = []
    for (const item of entry.apps) {
      const parsed = Transforms.apps.safeParse(item)
      if (!parsed.success) {
        issues.push({ source: `apps:${permaslug}:${variant}`, error: parsed.error })
        continue
      }
      validApps.push(parsed.data)

      // dedupe by app_id across all models/variants
      if (!appsMap.has(parsed.data.app.app_id)) {
        appsMap.set(parsed.data.app.app_id, {
          ...parsed.data.app,
          snapshot_at,
        })
      }
    }

    if (validApps.length > 0) {
      modelAppLeaderboards.push({
        model_permaslug: permaslug,
        model_variant: variant,
        apps: validApps.map(({ app, appTokens }) => ({
          app_id: app.app_id,
          total_tokens: appTokens.total_tokens,
          title: app.title,
          description: app.description,
          main_url: app.main_url,
          origin_url: app.origin_url,
          source_code_url: app.source_code_url,
          or_created_at: app.or_created_at,
        })),
        snapshot_at,
      })
    }
  }

  const apps = Array.from(appsMap.values())

  if (apps.length) await ctx.runMutation(internal.db.or.apps.upsert, { items: apps })
  if (modelAppLeaderboards.length)
    await ctx.runMutation(internal.db.or.modelAppLeaderboards.upsert, {
      items: modelAppLeaderboards,
    })

  return { apps, modelAppLeaderboards, issues }
}
