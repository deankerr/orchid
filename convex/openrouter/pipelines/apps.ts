import { internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import { storeSnapshotData } from '../archive'
import { output } from '../output'
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
  const appsMap = new Map<number, typeof Entities.apps.table.$content>()
  const appTokenMetrics: (typeof Entities.appTokenMetrics.table.$content)[] = []
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

  await ctx.runMutation(internal.openrouter.snapshot.insertResult, {
    snapshot_at,
    run_id,
    pipeline: 'apps',
    results,
    issues,
  })
}
