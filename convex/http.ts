import { httpRouter } from 'convex/server'

import { httpAction } from './_generated/server'
import { getArchiveBundle } from './snapshots/bundle'

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

export default http
