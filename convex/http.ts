import { httpRouter } from 'convex/server'

import { httpAction } from './_generated/server'
import { getSnapshotArchives } from './openrouter/archive'

const http = httpRouter()

// Enhanced archives endpoint for snapshot dashboard
http.route({
  path: '/archives',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url)
    const snapshotAtParam = url.searchParams.get('snapshot_at')
    const type = url.searchParams.get('type')
    const listOnly = url.searchParams.get('list') === 'true'

    try {
      // snapshot_at is required
      if (!snapshotAtParam) {
        return new Response("'snapshot_at' parameter is required", { status: 400 })
      }

      const snapshot_at = parseInt(snapshotAtParam, 10)
      if (isNaN(snapshot_at)) {
        return new Response("Invalid 'snapshot_at' parameter", { status: 400 })
      }

      // If no type specified, return error for now
      // TODO: Implement listing all types for a snapshot
      if (!type) {
        return new Response("'type' parameter is required", { status: 400 })
      }

      // Get archives for specific type
      const results = await getSnapshotArchives(ctx, snapshot_at, type)

      if (results.length === 0) {
        return new Response(`No archives found: ${type} for snapshot ${snapshot_at}`, {
          status: 404,
        })
      }

      // If list only, return metadata without data
      if (listOnly) {
        const archivesList = results.map((result) => ({
          type: result.archive.type,
          run_id: result.archive.run_id,
          size: result.archive.size,
          sha256: result.archive.sha256,
          _creationTime: result.archive._creationTime,
        }))

        return new Response(JSON.stringify(archivesList, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      // Return full data (existing behavior)
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
