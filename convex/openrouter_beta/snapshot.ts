import { v } from 'convex/values'
import { internalAction, type ActionCtx } from '../_generated/server'
import { getEpoch } from '../shared'
import { storeJSON } from '../files'
import { SyncReportCollector } from './report'
import { syncProviders } from './entities/providers'
import { syncModels } from './entities/models'
import { syncAuthors } from './entities/authors'
import { syncEndpoints } from './entities/endpoints'
import { syncApps } from './entities/apps'
import type { SyncConfig } from './types'

async function snapshot(ctx: ActionCtx, config: SyncConfig) {
  const collector = new SyncReportCollector(config.epoch, config.snapshotStartTime)

  console.log('Starting OpenRouter sync...', config)

  // Phase 1: Sync providers (independent entity)
  console.log('Syncing providers...')
  const providerData = await syncProviders(ctx, config)
  collector.add('providers', providerData)

  // Phase 2: Sync models (core entity)
  console.log('Syncing models...')
  const modelData = await syncModels(ctx, config)
  collector.add('models', modelData)

  // Phase 3: Sync endpoints (dependent on models)
  console.log('Syncing endpoints...')
  const endpointData = await syncEndpoints(ctx, config, modelData.items)
  collector.add('endpoints', endpointData.endpoints)
  collector.add('endpointStats', endpointData.endpointStats)
  collector.add('endpointUptimes', endpointData.endpointUptimes)

  // Phase 4: Sync apps (dependent on models)
  console.log('Syncing apps...')
  const appData = await syncApps(ctx, config, modelData.items)
  collector.add('apps', appData.apps)
  collector.add('appTokens', appData.appTokens)

  // Phase 5: Sync authors (dependent on models)
  console.log('Syncing authors...')
  const authorSlugs = Array.from(new Set(modelData.items.map((m) => m.author_slug)))
  const authorData = await syncAuthors(ctx, config, authorSlugs)
  collector.add('authors', authorData.authors)
  collector.add('modelTokenStats', authorData.modelTokenStats)

  // Create final report
  const { report, summary } = collector.create()

  // Store report
  const reportKey = `openrouter-sync-report-${config.snapshotStartTime}`
  await storeJSON(ctx, {
    key: reportKey,
    epoch: config.epoch,
    data: report,
    compress: config.compress,
  })

  const reportUrl = `${process.env.CONVEX_SITE_URL}/reports?key=${reportKey}`

  return {
    reportKey,
    reportUrl,
    summary,
  }
}

export const startSnapshot = internalAction({
  args: {
    epoch: v.optional(v.number()),
    compress: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const snapshotStartTime = Date.now()
    const config: SyncConfig = {
      epoch: args.epoch || getEpoch(),
      snapshotStartTime,
      compress: args.compress ?? true,
    }

    return await snapshot(ctx, config)
  },
})
