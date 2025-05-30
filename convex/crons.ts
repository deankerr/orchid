import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.hourly(
  'start sync',
  {
    minuteUTC: 10,
  },
  internal.sync.process.start,
)

export default crons
