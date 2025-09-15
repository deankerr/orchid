import { cronJobs } from 'convex/server'

import { internal } from './_generated/api'
import { internalAction } from './_generated/server'

const crons = cronJobs()

export const snapshotCron = internalAction({
  args: {},
  handler: async (ctx) => {
    const cfg = await ctx.runQuery(internal.db.snapshot.crawl.config.getFirst)
    if (!cfg?.enabled) return

    const h = new Date().getUTCHours()

    // helper: true  ⇒ fetch the component this tick
    const on = (every: number) => every > 0 && h % every === 0

    const shouldRunCore = on(cfg.core_every_hours)
    if (!shouldRunCore) {
      console.log('[cron:snapshot] crawl skipped for this hour')
      return
    }

    const jitter = Math.floor(Math.random() * cfg.jitter_minutes * 60_000)
    const delayMs = cfg.delay_minutes * 60_000 + jitter

    // Use the new single-bundle crawler
    await ctx.scheduler.runAfter(delayMs, internal.snapshots.crawl.run, {
      apps: on(cfg.apps_every_hours),
      uptimes: on(cfg.uptimes_every_hours),
      modelAuthors: on(cfg.authors_every_hours),
    })

    // Actions have a 10m max runtime; schedule materialize for after that window
    await ctx.scheduler.runAfter(delayMs + 10 * 60_000, internal.snapshots.materialize.main.run, {})
    await ctx.scheduler.runAfter(delayMs + 10 * 60_000, internal.snapshots.changes.main.run, {})

    console.log(`[cron:snapshot] scheduled crawl in ${Math.round(delayMs / 60000)}m`)
  },
})

crons.hourly('snapshot', { minuteUTC: 0 }, internal.crons.snapshotCron)

export default crons
