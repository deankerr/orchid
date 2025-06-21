import { Table } from 'convex-helpers/server'
import { v } from 'convex/values'

import { internal } from '../_generated/api'
import { internalAction, internalMutation, type ActionCtx } from '../_generated/server'
import { getHourAlignedTimestamp } from '../shared'
import { storeSnapshotData } from './archives'
import { syncApps } from './entities/apps'
import { syncAuthors } from './entities/authors'
import { syncEndpoints } from './entities/endpoints'
import { syncModels } from './entities/models'
import { syncProviders } from './entities/providers'
import { SnapshotReport } from './report'
import type { SyncConfig } from './types'
import { flattenSyncResults, runParallelSync } from './utils'

export const SnapshotConfig = Table('snapshot_config', {
  enabled: v.boolean(),
  interval_hours: v.number(),
  delay_minutes: v.number(),
  jitter_minutes: v.number(),
})

export const schedule = internalMutation({
  handler: async (ctx) => {
    const config = await ctx.db.query('snapshot_config').order('desc').first()
    if (!config) {
      console.log('No snapshot config found.')
      return
    }

    if (!config.enabled) {
      console.log('Snapshot disabled.')
      return
    }

    const hour = new Date().getHours()

    // Check if this is the right hour based on interval
    if (hour % config.interval_hours !== 0) {
      const nextHour = hour + (config.interval_hours - (hour % config.interval_hours))
      console.log(
        `Skipping this hour. Next snapshot hour: ${nextHour % 24}:00 (interval: ${config.interval_hours}h)`,
      )
      return
    }

    // Calculate delay with jitter
    const jitterMs = Math.floor(Math.random() * config.jitter_minutes * 60 * 1000)
    const delayMs = Math.max(0, config.delay_minutes * 60 * 1000 + jitterMs)

    await ctx.scheduler.runAfter(delayMs, internal.openrouter.snapshot.start)

    const delayMinutes = Math.round(delayMs / (60 * 1000))
    console.log(
      `Snapshot scheduled to start in ${delayMinutes} minutes (${config.delay_minutes}min delay + ${Math.round(jitterMs / (60 * 1000))}min jitter)`,
    )
  },
})

export const start = internalAction({
  handler: async (ctx) => {
    const startedAt = Date.now()
    const snapshotAt = getHourAlignedTimestamp(startedAt)

    const config: SyncConfig = {
      startedAt,
      snapshotAt,
      runId: startedAt.toString(),
    }

    return await snapshot(ctx, config)
  },
})

async function snapshot(ctx: ActionCtx, config: SyncConfig) {
  const collector = new SnapshotReport(config.snapshotAt, config.startedAt)

  console.log('snapshot', config)

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

  console.log({ reportUrl, ...summary })
}
