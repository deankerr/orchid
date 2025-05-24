import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface UptimeChartProps {
  uptime?: Array<{ date: string; uptime: number | null }>
}

export function UptimeChart({ uptime }: UptimeChartProps) {
  // Generate 72 hours of segments, filling in data where available
  const generateFullTimeline = () => {
    const segments = []
    const now = new Date()

    for (let i = 71; i >= 0; i--) {
      const hourTime = new Date(now.getTime() - i * 60 * 60 * 1000)

      // Find matching uptime data for this hour
      const uptimeData = uptime?.find((point) => {
        // API data is in US Eastern time, need to convert to local time
        const apiDate = new Date(point.date)

        // Get the Eastern time offset (EST = UTC-5, EDT = UTC-4)
        // We'll approximate by checking if it's likely DST period
        const isLikelyDST = apiDate.getMonth() > 2 && apiDate.getMonth() < 11 // Rough DST period
        const easternOffset = isLikelyDST ? -4 : -5 // Hours from UTC

        // Convert from Eastern time to UTC, then to local
        const easternTimeInUTC = new Date(apiDate.getTime() - easternOffset * 60 * 60 * 1000)

        // Compare the hour in local time
        return (
          easternTimeInUTC.getFullYear() === hourTime.getFullYear() &&
          easternTimeInUTC.getMonth() === hourTime.getMonth() &&
          easternTimeInUTC.getDate() === hourTime.getDate() &&
          easternTimeInUTC.getHours() === hourTime.getHours()
        )
      })

      segments.push({
        date: hourTime.toISOString(),
        uptime: uptimeData?.uptime ?? null,
        displayDate: hourTime.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    }

    return segments
  }

  const timeline = generateFullTimeline()

  const normalizeUptime = (uptimeValue: number | null) => {
    if (uptimeValue === null) return null
    // Handle both percentage (0-100) and decimal (0-1) formats
    return uptimeValue > 1 ? uptimeValue / 100 : uptimeValue
  }

  const getUptimeColor = (uptimeValue: number | null) => {
    const normalized = normalizeUptime(uptimeValue)
    if (normalized === null) return 'bg-gray-300'
    if (normalized >= 0.99) return 'bg-green-500'
    if (normalized >= 0.95) return 'bg-green-400'
    if (normalized >= 0.8) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getUptimeTooltip = (uptimeValue: number | null, displayDate: string) => {
    const normalized = normalizeUptime(uptimeValue)
    if (normalized === null) return `${displayDate}: No data`
    return `${displayDate}: ${(normalized * 100).toFixed(1)}% uptime`
  }

  // Calculate overall uptime percentage
  const validUptimePoints = timeline.filter((point) => point.uptime !== null)
  const overallUptime =
    validUptimePoints.length > 0
      ? validUptimePoints.reduce((sum, point) => sum + normalizeUptime(point.uptime)!, 0) /
        validUptimePoints.length
      : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          <span className="text-sm font-medium">Endpoint Uptime</span>
        </div>
        <span className="text-sm font-medium">{(overallUptime * 100).toFixed(1)}% uptime</span>
      </div>

      <div className="flex gap-0.5">
        {timeline.map((point, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <div
                className={`h-8 w-2 ${getUptimeColor(point.uptime)} cursor-pointer transition-opacity hover:opacity-80`}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{getUptimeTooltip(point.uptime, point.displayDate)}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>72h ago</span>
        <span>Now</span>
      </div>
    </div>
  )
}
