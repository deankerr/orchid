import { httpRouter } from 'convex/server'

import { httpAction } from './_generated/server'
import { getArchiveBundle } from './snapshots/shared/bundle'

const http = httpRouter()

http.route({
  path: '/bundle',
  method: 'GET',
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url)
    const crawlId = url.searchParams.get('crawl_id')
    const select = url.searchParams.get('select')

    if (!crawlId) {
      return new Response('Missing crawl_id parameter', { status: 400 })
    }

    const bundle = await getArchiveBundle(ctx, crawlId)

    if (!bundle) {
      return new Response('Bundle not found', { status: 404 })
    }

    let responseData: any = bundle

    // If select=endpoints, return only the endpoints as a flat array
    if (select === 'endpoints') {
      const allEndpoints = bundle.data.models.flatMap((modelEntry) => modelEntry.endpoints)
      responseData = allEndpoints
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }),
})

export default http
