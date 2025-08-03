import type { Infer } from 'convex/values'
import type z4 from 'zod/v4'

import * as DB from '@/convex/db'

import { internal } from '../../_generated/api'
import type { Doc } from '../../_generated/dataModel'
import { ActionCtx } from '../../_generated/server'
import * as Transforms from '../transforms'
import { getFromStorage, type ConsolidatedModel } from './utils'

export async function calculateApps(
  ctx: ActionCtx,
  archives: Doc<'snapshot_raw_archives'>[],
  consolidatedModels: ConsolidatedModel[],
  snapshot_at: number,
) {
  const appsMap = new Map<number, Infer<typeof DB.OrApps.vTable.validator>>()
  const modelAppLeaderboards: Infer<typeof DB.OrModelAppLeaderboards.vTable.validator>[] = []
  const issues: { source: string; error: z4.ZodError }[] = []

  for (const model of consolidatedModels) {
    for (const variant of model.variants) {
      const appRow = archives.find(
        (r) => r.path === `/api/frontend/stats/app?permaslug=${model.permaslug}&variant=${variant}`,
      )
      if (!appRow) continue

      const { data: items } = await getFromStorage(ctx, appRow.storage_id)
      if (!items) continue

      const validApps: any[] = []

      for (const item of items) {
        const parsed = Transforms.apps.safeParse(item)
        if (!parsed.success) {
          issues.push({ source: `apps:${model.permaslug}:${variant}`, error: parsed.error })
          continue
        }

        validApps.push(parsed.data)

        // Dedupe apps by app_id
        if (!appsMap.has(parsed.data.app.app_id)) {
          appsMap.set(parsed.data.app.app_id, {
            ...parsed.data.app,
            snapshot_at,
          })
        }
      }

      // Create model app leaderboard entry
      if (validApps.length > 0) {
        modelAppLeaderboards.push({
          model_permaslug: model.permaslug,
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
  }

  const apps = Array.from(appsMap.values())

  // Persist apps and leaderboards
  if (apps.length) await ctx.runMutation(internal.db.or.apps.upsert, { items: apps })

  if (modelAppLeaderboards.length)
    await ctx.runMutation(internal.db.or.modelAppLeaderboards.upsert, {
      items: modelAppLeaderboards,
    })

  return { apps, modelAppLeaderboards, issues }
}
