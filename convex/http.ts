import { httpRouter } from 'convex/server'

import { httpAction } from './_generated/server'
import { getSnapshotArchives } from './openrouter/archives'

const http = httpRouter()

http.route({
  path: '/archives',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url)
    const snapshotAtParam = url.searchParams.get('snapshot_at')
    const type = url.searchParams.get('type') || 'report'

    try {
      // snapshot_at is now required
      if (!snapshotAtParam) {
        return new Response("'snapshot_at' parameter is required", { status: 400 })
      }

      const snapshot_at = parseInt(snapshotAtParam, 10)
      if (isNaN(snapshot_at)) {
        return new Response("Invalid 'snapshot_at' parameter", { status: 400 })
      }

      // Get all archives for this snapshot_at and type, sorted latest first
      const results = await getSnapshotArchives(ctx, snapshot_at, type)

      if (results.length === 0) {
        return new Response(`No archives found: ${type} for snapshot ${snapshot_at}`, {
          status: 404,
        })
      }

      // Return all results as an array
      const responseData = results.map((result) => ({
        archive: {
          type: result.archive.type,
          run_id: result.archive.run_id,
          size: result.archive.size,
          sha256: result.archive.sha256,
          _creationTime: result.archive._creationTime,
        },
        data: result.data,
      }))

      return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (error) {
      console.error('Error retrieving archive:', error)
      return new Response('Internal server error', { status: 500 })
    }
  }),
})

export default http
