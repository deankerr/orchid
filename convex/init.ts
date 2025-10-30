import { internal } from './_generated/api'
import { internalMutation } from './_generated/server'

// run a single initial snapshot

const init = internalMutation({
  handler: async (ctx) => {
    console.log('[init] snapshot')

    const endpoint = await ctx.db.query('or_views_endpoints').first()
    if (endpoint) {
      console.log('[init] abort: or_views_endpoints is not empty')
      return
    }

    await ctx.scheduler.runAfter(1000 * 60, internal.snapshots.crawl.main.run, {
      apps: false,
      uptimes: false,
      modelAuthors: false,
      analytics: false,
      onComplete: {
        materialize: true,
        changes: false,
        materializedChanges: false,
      },
    })

    await ctx.scheduler.runAfter(5 * 60_000, internal.snapshots.materialize.main.run, {})
    await ctx.scheduler.runAfter(5 * 60_000, internal.snapshots.changes.main.run, {})
  },
})

export default init
