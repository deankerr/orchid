import { httpRouter } from 'convex/server'
import * as R from 'remeda'

import { api, internal } from './_generated/api'
import { httpAction } from './_generated/server'
import { getEnv } from './lib/utils'

const http = httpRouter()

// Power user API (preview)
http.route({
  path: '/listmeps',
  method: 'GET',
  handler: httpAction(async (ctx) => {
    const endpointsList = await ctx.runQuery(api.db.or.views.endpoints.all)

    const availableList = endpointsList.filter(
      (endpoint) => !R.isDefined(endpoint.unavailable_at) && !endpoint.disabled,
    )

    const models = Map.groupBy(availableList, (e) => e.model.slug)
      .values()
      .map((group) => {
        const model = group[0].model
        const endpoints = group.map((endpoint) => {
          // rename keys
          const data_policy = R.mapKeys(endpoint.data_policy, (key) => {
            if (key === 'can_publish') return 'publish_prompts'
            if (key === 'retains_prompts') return 'retain_prompts'
            if (key === 'retains_prompts_days') return 'retain_prompts_days'
            return key
          })

          // prices as standard notation strings
          const pricing = R.mapValues(endpoint.pricing, (val) =>
            val.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 20,
            }),
          )

          return {
            provider_id: endpoint.provider.tag_slug,
            provider_name: endpoint.provider.name,
            provider_region: endpoint.provider.region,
            context_length: endpoint.context_length,
            pricing,
            supported_parameters: endpoint.supported_parameters,
            quantization: endpoint.quantization,
            completions: endpoint.completions,
            chat_completions: endpoint.chat_completions,
            caching: R.isDefined(endpoint.pricing.cache_read),
            implicit_caching: endpoint.implicit_caching,
            data_policy,
            limits: endpoint.limits,
            moderated: endpoint.moderated,
            mandatory_reasoning: endpoint.mandatory_reasoning,
            native_web_search: endpoint.native_web_search,
            tools: endpoint.supported_parameters.includes('tools'),
            response_format: endpoint.supported_parameters.includes('response_format'),
            structured_outputs: endpoint.supported_parameters.includes('structured_outputs'),
          }
        })

        return {
          id: model.slug,
          canonical_id: model.version_slug,
          name: model.name,
          author_name: model.author_name,
          variant: model.variant,
          created_at: new Date(model.or_added_at).toISOString(),
          input_modalities: model.input_modalities,
          output_modalities: model.output_modalities,
          reasoning: model.reasoning,
          // more user-friendly name for these
          providers: endpoints,
        }
      })
      .toArray()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))

    const result = {
      updated_at: new Date(
        endpointsList.reduce((max, e) => Math.max(max, e.updated_at), 0),
      ).toISOString(),
      models,
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }),
})

// Archive sync endpoints for dev/preview environments
const SYNC_RECORDS_LIMIT = 20

function validateSyncKey(req: Request): boolean {
  const SYNC_KEY = getEnv('ARCHIVE_SYNC_KEY')
  const key = req.headers.get('x-sync-key')
  return key === SYNC_KEY
}

http.route({
  path: '/sync/archives',
  method: 'GET',
  handler: httpAction(async (ctx, req) => {
    if (!validateSyncKey(req)) {
      return new Response('Unauthorized', { status: 401 })
    }

    const archives = await ctx.runQuery(internal.db.snapshot.crawl.archives.list, {
      paginationOpts: { cursor: null, numItems: SYNC_RECORDS_LIMIT },
    })

    return new Response(JSON.stringify(archives), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }),
})

http.route({
  path: '/sync/archive',
  method: 'GET',
  handler: httpAction(async (ctx, req) => {
    if (!validateSyncKey(req)) {
      return new Response('Unauthorized', { status: 401 })
    }

    const url = new URL(req.url)
    const crawlId = url.searchParams.get('crawl_id')

    if (!crawlId) {
      return new Response('Missing crawl_id parameter', { status: 400 })
    }

    const archive = await ctx.runQuery(internal.db.snapshot.crawl.archives.getByCrawlId, {
      crawl_id: crawlId,
    })

    if (!archive) {
      return new Response('Archive not found', { status: 404 })
    }

    const blob = await ctx.storage.get(archive.storage_id)
    if (!blob) {
      return new Response('Bundle not found', { status: 404 })
    }

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    })
  }),
})

export default http
