import { cronJobs } from 'convex/server'

import { internal } from './_generated/api'
import { internalAction } from './_generated/server'

const crons = cronJobs()

export const snapshotCron = internalAction({
  args: {},
  handler: async (ctx) => {
    const cfg = await ctx.runQuery(internal.db.snapshot.crawlConfig.getFirst)
    if (!cfg?.enabled) return

    const h = new Date().getUTCHours()

    // helper: true  ⇒ fetch the component this tick
    const on = (every: number) => every > 0 && h % every === 0

    const args = {
      providers: on(cfg.core_every_hours),
      models: on(cfg.core_every_hours),

      endpoints: on(cfg.core_every_hours),
      uptimes: on(cfg.uptimes_every_hours),
      apps: on(cfg.apps_every_hours),
      modelAuthors: on(cfg.authors_every_hours),
    }

    const jitter = Math.floor(Math.random() * cfg.jitter_minutes * 60_000)
    const delayMs = cfg.delay_minutes * 60_000 + jitter

    await ctx.scheduler.runAfter(delayMs, internal.snapshots.crawl.run, args)
    console.log(
      `snapshot.crawlToStorage scheduled (in ${Math.round(delayMs / 60000)}m) with args:`,
      JSON.stringify(args),
    )
  },
})

crons.hourly('snapshot', { minuteUTC: 0 }, internal.crons.snapshotCron)

export default crons
