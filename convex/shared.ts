// time aligned to the start of the hour
export function getHourAlignedTimestamp(now: number = Date.now()) {
  const date = new Date(now)
  date.setMinutes(0, 0, 0)
  return date.getTime()
}
