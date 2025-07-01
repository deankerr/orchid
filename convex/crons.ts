import { cronJobs } from 'convex/server'

import { internal } from './_generated/api'

const crons = cronJobs()

crons.hourly(
  'snapshot',
  {
    minuteUTC: 0,
  },
  internal.openrouter.schedule.default,
)

export default crons
