import { v } from 'convex/values'

import { internal } from '../_generated/api'
import { internalMutation } from '../_generated/server'
import { Table2 } from '../table2'

export const SnapshotSchedule = Table2('snapshot_schedule', {
  enabled: v.boolean(),
  interval_hours: v.number(),
  delay_minutes: v.number(),
  jitter_minutes: v.number(),
})

export default internalMutation({
  handler: async (ctx) => {
    const config = await ctx.db.query(SnapshotSchedule.name).order('desc').first()
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
