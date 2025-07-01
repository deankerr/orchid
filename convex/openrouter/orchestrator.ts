import { internal } from '../_generated/api'
import { type ActionCtx } from '../_generated/server'
import { getHourAlignedTimestamp } from '../shared'
import { runPipelines } from './pipelineRunner'
import { appsPipeline } from './pipelines/apps'
import { endpointsPipeline } from './pipelines/endpoints'
import { endpointUptimeMetricsPipeline } from './pipelines/endpointUptimeMetrics'
import { modelsPipeline } from './pipelines/models'
import { modelTokenMetricsPipeline } from './pipelines/modelTokenMetrics'
import { providersPipeline } from './pipelines/providers'
import { OpenRouter } from './sources'

export async function orchestrator(ctx: ActionCtx) {
  // ------------------------------------------------------------
  // Record snapshot run start
  // ------------------------------------------------------------
  const snapshot_at = getHourAlignedTimestamp()
  const run_id = await ctx.runMutation(internal.openrouter.snapshot.insertRun, {
    snapshot_at,
    started_at: Date.now(),
  })

  // ------------------------------------------------------------
  // Stage 1 – models (critical) + providers (independent)
  // ------------------------------------------------------------

  const stage1 = await runPipelines({
    models: () =>
      modelsPipeline(ctx, {
        snapshot_at,
        run_id,
        source: { models: OpenRouter.fetch.models },
      }),
    providers: () =>
      providersPipeline(ctx, {
        snapshot_at,
        run_id,
        source: { providers: OpenRouter.fetch.providers },
      }),
  })

  const stage1Pipelines = Object.entries(stage1).map(([name, res]) => ({
    name,
    ok: res.ok,
    error: res.ok ? undefined : res.error,
    metrics: res.ok ? res.value.metrics : undefined,
  })) as { name: string; ok: boolean; error?: string; metrics?: any }[]

  // If models failed, abort the run early.
  if (!stage1.models.ok) {
    await ctx.runMutation(internal.openrouter.snapshot.updateRun, {
      run_id,
      ended_at: Date.now(),
      ok: false,
      pipelines: stage1Pipelines,
    })
    return
  }

  const models = stage1.models.value.data

  // ------------------------------------------------------------
  // Stage 2 – parallel pipelines that depend on models
  // ------------------------------------------------------------

  const stage2 = await runPipelines({
    endpointsUptimeMetrics: async () => {
      const endpoints = await endpointsPipeline(ctx, {
        snapshot_at,
        run_id,
        models,
        source: { endpoints: OpenRouter.fetch.endpoints },
      })
      const uptimes = await endpointUptimeMetricsPipeline(ctx, {
        snapshot_at,
        run_id,
        endpoints: endpoints.data,
        source: { endpointUptimes: OpenRouter.fetch.uptimes },
      })

      return { data: undefined, metrics: [endpoints.metrics, uptimes.metrics] }
    },
    apps: () =>
      appsPipeline(ctx, {
        snapshot_at,
        run_id,
        models,
        source: { apps: OpenRouter.fetch.apps },
      }),
    modelTokenMetrics: () =>
      modelTokenMetricsPipeline(ctx, {
        snapshot_at,
        run_id,
        models,
        source: { authors: OpenRouter.fetch.author },
      }),
  })

  const stage2Pipelines = Object.entries(stage2).map(([name, res]) => ({
    name,
    ok: res.ok,
    error: res.ok ? undefined : res.error,
    metrics: res.ok ? res.value.metrics : undefined,
  })) as { name: string; ok: boolean; error?: string; metrics?: any }[]

  const allPipelines = [...stage1Pipelines, ...stage2Pipelines]
  const ok = allPipelines.every((p) => p.ok)

  await ctx.runMutation(internal.openrouter.snapshot.updateRun, {
    run_id,
    ended_at: Date.now(),
    ok,
    pipelines: allPipelines,
  })
}
