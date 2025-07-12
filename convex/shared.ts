export function getHourAlignedTimestamp(now = Date.now()) {
  const date = new Date(now)
  date.setMinutes(0, 0, 0)
  return date.getTime()
}

export function getDayAlignedTimestamp(now = Date.now()) {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function hoursBetween(from: number, to: number) {
  return Math.floor((to - from) / (1000 * 60 * 60))
}
