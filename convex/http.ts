import { httpRouter } from 'convex/server'
import { v } from 'convex/values'

import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { httpAction, internalAction } from './_generated/server'
import { retrieveArchive } from './snapshots_v2/archive'

const http = httpRouter()

// Internal action to get archive data
export const getArchiveData = internalAction({
  args: { archiveId: v.id('snapshot_archives') },
  returns: v.union(
    v.object({
      archive: v.object({
        type: v.string(),
        run_id: v.string(),
        size: v.number(),
        sha256: v.string(),
        _creationTime: v.number(),
      }),
      data: v.any(),
    }),
    v.null(),
  ),
  handler: async (ctx, { archiveId }): Promise<any> => {
    // Get the specific archive by its ID
    const archive = await ctx.runQuery(internal.db.snapshot.archives.getById, {
      id: archiveId,
    })

    if (!archive) {
      return null
    }

    // Retrieve the archive data
    const archivedData = await retrieveArchive(ctx, archive.storage_id)

    return {
      archive: {
        type: archive.type,
        run_id: archive.run_id,
        size: archive.size,
        sha256: archive.sha256,
        _creationTime: archive._creationTime,
      },
      data: archivedData,
    }
  },
})

// Simplified archives endpoint - retrieves specific archive by ID
http.route({
  path: '/archives',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url)
    const archiveId = url.searchParams.get('id') as Id<'snapshot_archives'> | null

    try {
      if (!archiveId) {
        return new Response("'id' parameter is required", { status: 400 })
      }

      // Get the archive data using internal action
      const result = await ctx.runAction(internal.http.getArchiveData, { archiveId })

      if (!result) {
        return new Response(`Archive not found: ${archiveId}`, { status: 404 })
      }

      return new Response(JSON.stringify(result, null, 2), {
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
