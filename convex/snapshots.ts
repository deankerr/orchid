import { v } from 'convex/values'
import prettyBytes from 'pretty-bytes'
import { internalMutation } from './_generated/server'

export const insertSnapshot = internalMutation({
  args: {
    category: v.string(),
    key: v.string(),
    epoch: v.number(),
    data: v.any(),
  },
  handler: async (ctx, { category, key, epoch, data }) => {
    const stringified = JSON.stringify(data)
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stringified))

    const id = await ctx.db.insert('snapshots', {
      category,
      key,
      epoch,
      hash,
      data: stringified,
    })

    const items = Array.isArray(data) ? data.length : 1

    console.log(`[snapshot] ${category}:${key} (${items})`, prettyBytes(stringified.length))

    return id
  },
})
