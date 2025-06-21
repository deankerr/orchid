import { cronJobs } from 'convex/server'

import { internal } from './_generated/api'

const crons = cronJobs()

crons.hourly(
  'snapshot',
  {
    minuteUTC: 0,
  },
  internal.openrouter.snapshot.schedule,
)

export default crons
