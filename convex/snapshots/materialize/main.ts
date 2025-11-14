import { v, type Infer } from 'convex/values'
import { z } from 'zod'

import { db } from '@/convex/db'

import { internal } from '../../_generated/api'
import { internalAction } from '../../_generated/server'
import type { CrawlArchiveBundle } from '../crawl/main'
import { getArchiveBundleOrThrow } from '../shared/bundle'
import { EndpointTransformSchema } from './validators/endpoints'

export const run = internalAction({
  args: { crawl_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const bundle = await getArchiveBundleOrThrow(ctx, args.crawl_id)

    console.log(`[materialize]`, { crawl_id: bundle.crawl_id })

    const { models, endpoints, providers } = materializeModelEndpoints(bundle)

    if (endpoints.length === 0) {
      console.warn(`[materialize] abort: no endpoints found`)
      return
    }

    await ctx.runMutation(internal.snapshots.materialize.output.upsert, {
      models,
      endpoints,
      providers,
      crawl_id: bundle.crawl_id,
    })

    // * schedule materializeChanges
    await ctx.scheduler.runAfter(0, internal.snapshots.materializedChanges.main.run, {})
  },
})

export function materializeModelEndpoints(bundle: CrawlArchiveBundle) {
  const rawEndpoints = bundle.data.models.flatMap((m) => m.endpoints)

  const modelsMap = new Map<
    string,
    Omit<Infer<typeof db.or.views.models.vTable.validator>, 'updated_at'>
  >()
  const endpointsMap = new Map<
    string,
    Omit<Infer<typeof db.or.views.endpoints.vTable.validator>, 'updated_at'>
  >()
  const providersMap = new Map<
    string,
    Omit<Infer<typeof db.or.views.providers.vTable.validator>, 'updated_at'>
  >()
  const issues: string[] = []

  for (const raw of rawEndpoints) {
    const parsed = EndpointTransformSchema.safeParse(raw)

    if (!parsed.success) {
      issues.push(z.prettifyError(parsed.error))
      continue
    }

    const { model, endpoint, provider } = parsed.data
    modelsMap.set(model.slug, model)
    endpointsMap.set(endpoint.uuid, endpoint)
    providersMap.set(provider.slug, provider)
  }

  if (issues.length) console.error('[materialize:endpoints]', { issues })

  return {
    models: Array.from(modelsMap.values()),
    endpoints: Array.from(endpointsMap.values()),
    providers: Array.from(providersMap.values()),
    issues,
  }
}
