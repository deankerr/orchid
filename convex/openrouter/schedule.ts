import { internal } from '../_generated/api'
import { internalMutation } from '../_generated/server'
import * as SnapshotScheduleDB from '../db/snapshot/schedule'

export default internalMutation({
  handler: async (ctx) => {
    const config = await SnapshotScheduleDB.getLatest.run(ctx, {})
    if (!config) {
      console.log('No snapshot config found.')
      return
    }

    if (!config.enabled) {
      console.log('Snapshot disabled.')
      return
    }

    const hour = new Date().getHours()

    // Check if this is the right hour based on interval
    if (hour % config.interval_hours !== 0) {
      return
    }

    // Calculate delay with jitter
    const jitterMs = Math.floor(Math.random() * config.jitter_minutes * 60 * 1000)
    const delayMs = Math.max(0, config.delay_minutes * 60 * 1000 + jitterMs)

    await ctx.scheduler.runAfter(delayMs, internal.openrouter.snapshot.run)

    const delayMinutes = Math.round(delayMs / (60 * 1000))
    console.log(
      `Snapshot scheduled to start in ${delayMinutes} minutes (${config.delay_minutes}min delay + ${Math.round(jitterMs / (60 * 1000))}min jitter)`,
    )
  },
})
