import { internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import { storeSnapshotData } from '../archive'
import type { OrModelAppLeaderboards } from '../entities/modelAppLeaderboards'
import { batch, output } from '../output'
import type { Entities } from '../registry'
import { validateArray, type Issue } from '../validation'
import { AppStrictSchema, AppTransformSchema } from '../validators/apps'

export async function appsPipeline(
  ctx: ActionCtx,
  {
    snapshot_at,
    run_id,
    models,
    source,
  }: {
    snapshot_at: number
    run_id: string
    models: (typeof Entities.models.table.$content)[]
    source: {
      apps: (args: { permaslug: string; variant: string }) => Promise<unknown[]>
    }
  },
) {
  const started_at = Date.now()
  const appsMap = new Map<number, typeof Entities.apps.table.$content>()
  const appTokenMetrics: (typeof Entities.appTokenMetrics.table.$content)[] = []
  const modelAppLeaderboards: (typeof OrModelAppLeaderboards.$content)[] = []
  const issues: Issue[] = []
  const rawAppResponses: [string, unknown][] = []

  for (const model of models) {
    for (const variant of model.variants) {
      const { permaslug } = model

      const data = await source.apps({ permaslug, variant })

      // Collect raw response for batched archival
      rawAppResponses.push([`${model.slug}:${variant}`, data])

      const { items, issues: validationIssues } = validateArray(
        data,
        AppTransformSchema,
        AppStrictSchema,
      )

      issues.push(...validationIssues)

      modelAppLeaderboards.push({
        model_permaslug: permaslug,
        model_variant: variant,
        apps: items.map(({ app, appTokens }) => ({
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

      for (const item of items) {
        // Dedupe apps by app_id
        if (!appsMap.has(item.app.app_id)) {
          appsMap.set(item.app.app_id, {
            ...item.app,
            snapshot_at,
          })
        }

        appTokenMetrics.push({
          ...item.appTokens,
          model_permaslug: model.permaslug,
          model_slug: model.slug,
          model_variant: variant,
          snapshot_at,
        })
      }
    }
  }

  const apps = Array.from(appsMap.values())

  // Store batched app responses
  await storeSnapshotData(ctx, {
    run_id,
    snapshot_at,
    type: 'apps',
    data: rawAppResponses,
  })

  const results = await output(ctx, {
    entities: [
      {
        name: 'apps',
        items: apps,
      },
      {
        name: 'appTokenMetrics',
        items: appTokenMetrics,
      },
    ],
  })

  await batch({ items: modelAppLeaderboards }, async (items) => {
    return await ctx.runMutation(internal.openrouter.entities.modelAppLeaderboards.insert, {
      items,
    })
  })

  return {
    data: undefined,
    metrics: {
      entities: results,
      issues,
      started_at,
      ended_at: Date.now(),
    },
  }
}
