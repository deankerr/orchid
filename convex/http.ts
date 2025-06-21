import { httpRouter } from 'convex/server'

import { httpAction } from './_generated/server'
import { getLatestSnapshot, getSnapshotArchive, getSnapshotArchives } from './openrouter/archives'

const http = httpRouter()

http.route({
  path: '/archives',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url)
    const snapshotAtParam = url.searchParams.get('snapshot_at')
    const type = url.searchParams.get('type')
    const showIndex = url.searchParams.get('index') === 'true'

    try {
      // If no snapshot_at specified, get the latest
      let snapshot_at: number
      if (snapshotAtParam) {
        snapshot_at = parseInt(snapshotAtParam, 10)
        if (isNaN(snapshot_at)) {
          return new Response("Invalid 'snapshot_at' parameter", { status: 400 })
        }
      } else {
        const latestSnapshot = await getLatestSnapshot(ctx)
        if (!latestSnapshot) {
          return new Response('No archives found', { status: 404 })
        }
        snapshot_at = latestSnapshot
      }

      // If showing index, return all archives for this snapshot
      if (showIndex) {
        const archives = await getSnapshotArchives(ctx, snapshot_at)
        const indexData = {
          snapshot_at,
          archives: archives.map((archive) => ({
            type: archive.type,
            run_id: archive.run_id,
            size: archive.size,
            sha256: archive.sha256,
            _creationTime: archive._creationTime,
          })),
        }

        return new Response(JSON.stringify(indexData, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      // Get specific archive (default to 'report' if no type specified)
      const archiveType = type || 'report'
      const result = await getSnapshotArchive(ctx, snapshot_at, archiveType)

      if (!result) {
        return new Response(`Archive not found: ${archiveType} for snapshot ${snapshot_at}`, {
          status: 404,
        })
      }

      return new Response(JSON.stringify(result.data, null, 2), {
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
