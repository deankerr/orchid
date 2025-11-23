import { httpRouter } from 'convex/server'

import { httpAction } from './_generated/server'
import { bundleSyncHttpHandler } from './admin/bundleSync'
import { previewV1HttpHandler } from './public_api/preview_v1'
import { previewV2HttpHandler } from './public_api/preview_v2'
import { getArchiveBundle } from './snapshots/shared/bundle'

const http = httpRouter()

http.route({
  path: '/bundle',
  method: 'GET',
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url)
    const crawlId = url.searchParams.get('crawl_id')

    if (!crawlId) {
      return new Response('Missing crawl_id parameter', { status: 400 })
    }

    const bundle = await getArchiveBundle(ctx, crawlId)

    if (!bundle) {
      return new Response('Bundle not found', { status: 404 })
    }

    return new Response(JSON.stringify(bundle), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }),
})

http.route({
  path: '/public-api-preview/v2',
  method: 'GET',
  handler: httpAction(async (ctx) => {
    const result = await previewV2HttpHandler(ctx)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }),
})

http.route({
  path: '/public-api-preview/v1',
  method: 'GET',
  handler: httpAction(async (ctx) => {
    const result = await previewV1HttpHandler(ctx)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }),
})

http.route({
  method: 'GET',
  pathPrefix: '/sync/',
  handler: bundleSyncHttpHandler,
})

export default http
