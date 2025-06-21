import { v } from 'convex/values'
import { internalAction, type ActionCtx } from '../_generated/server'
import { getHourAlignedTimestamp } from '../shared'
import { SnapshotReport } from './report'
import { syncProviders } from './entities/providers'
import { syncModels } from './entities/models'
import { syncAuthors } from './entities/authors'
import { syncEndpoints } from './entities/endpoints'
import { syncApps } from './entities/apps'
import type { SyncConfig } from './types'
import { runParallelSync, flattenSyncResults } from './utils'
import { storeSnapshotData } from './archives'

async function snapshot(ctx: ActionCtx, config: SyncConfig) {
  const collector = new SnapshotReport(config.snapshotAt, config.startedAt)

  console.log('Starting OpenRouter sync...', config)

  // Phase 1 & 2: Run providers and models in parallel (both are independent)
  console.log('Syncing providers and models in parallel...')
  const phase1Results = await runParallelSync({
    providers: syncProviders(ctx, config),
    models: syncModels(ctx, config),
  })

  // Flatten and add all results to collector
  const phase1Data = flattenSyncResults(phase1Results)
  for (const [entity, data] of Object.entries(phase1Data)) {
    collector.add(entity, data)
  }

  // Check if we can proceed - we need models for the next phases
  if (!phase1Data.models || phase1Data.models.items.length === 0) {
    console.warn('No models found, skipping dependent phases')

    // Create final report with partial data
    const { report, summary } = collector.create()

    // Store report in archives
    await storeSnapshotData(ctx, {
      run_id: config.runId,
      snapshot_at: config.snapshotAt,
      type: 'report',
      data: report,
    })

    const reportUrl = `${process.env.CONVEX_SITE_URL}/archives?snapshot_at=${config.snapshotAt}`
    return { reportUrl, summary }
  }

  // Phase 3, 4, 5: Run endpoints, apps, and authors in parallel (all depend on models)
  console.log('Syncing endpoints, apps, and authors in parallel...')
  const modelItems = phase1Data.models.items
  const authorSlugs = Array.from(new Set(modelItems.map((m) => m.author_slug)))

  const phase2Results = await runParallelSync({
    endpoints: syncEndpoints(ctx, config, modelItems),
    apps: syncApps(ctx, config, modelItems),
    authors: syncAuthors(ctx, config, authorSlugs),
  })

  // Flatten and add all results to collector
  const phase2Data = flattenSyncResults(phase2Results)
  for (const [entity, data] of Object.entries(phase2Data)) {
    collector.add(entity, data)
  }

  // Create final report
  const { report, summary } = collector.create()

  // Store report in archives
  await storeSnapshotData(ctx, {
    run_id: config.runId,
    snapshot_at: config.snapshotAt,
    type: 'report',
    data: report,
  })

  const reportUrl = `${process.env.CONVEX_SITE_URL}/archives?snapshot_at=${config.snapshotAt}`

  return {
    reportUrl,
    summary,
  }
}

export const startSnapshot = internalAction({
  args: {
    snapshotAt: v.optional(v.number()),
    compress: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const startedAt = Date.now()

    const config: SyncConfig = {
      snapshotAt: args.snapshotAt || getHourAlignedTimestamp(),
      startedAt,
      runId: startedAt.toString(),
      compress: args.compress ?? true,
    }

    return await snapshot(ctx, config)
  },
})
