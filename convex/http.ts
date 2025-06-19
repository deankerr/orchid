import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { retrieveJSON } from './files'

const http = httpRouter()

http.route({
  path: '/reports',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url)
    const key = url.searchParams.get('key')

    if (!key) {
      return new Response("Missing 'key' parameter", { status: 400 })
    }

    try {
      // Get the file record by key
      const fileRecord = await ctx.runQuery(internal.files.getFileRecordByKey, { key })
      if (!fileRecord) {
        return new Response('Report not found', { status: 404 })
      }

      // Retrieve the report data (JSON)
      const reportData = await retrieveJSON(ctx, fileRecord._id)

      return new Response(JSON.stringify(reportData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (error) {
      console.error('Error retrieving report:', error)
      return new Response('Internal server error', { status: 500 })
    }
  }),
})

export default http
