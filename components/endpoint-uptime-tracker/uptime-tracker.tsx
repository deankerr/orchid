import { memo } from 'react'

import { getHourAlignedTimestamp } from '@/convex/shared'

import { formatTimestampToYMDHM } from '@/lib/utils'

import { Tracker } from './tracker'

function UptimeTracker_({}: { endpoint_uuid: string }) {
  // NOTE: backend functionality is disabled
  // const uptimeMetrics = useEndpointUptimes(endpoint_uuid)
  const uptimeMetrics = {
    latest_72h: [] as any[],
  }

  if (!uptimeMetrics) {
    return <div className="font-mono text-sm text-muted-foreground">Loading...</div>
  }

  const uptimes = uptimeMetrics.latest_72h

  const hours = 72
  const hourMs = 60 * 60 * 1000
  const now = getHourAlignedTimestamp()

  const getColor = (value?: number) => {
    if (value === undefined) return
    if (value >= 99) return 'bg-emerald-500'
    if (value >= 85) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  const slots = [...Array(hours)]
    .map((_, i) => {
      const timestamp = now - hourMs * i
      const uptime = uptimes.find((m) => m.timestamp === timestamp)?.uptime
      const timeString = formatTimestampToYMDHM(timestamp)
      const tooltip = `${timeString} - ${uptime === undefined ? 'no data' : uptime.toFixed(2) + '%'}`

      return {
        key: timestamp,
        color: getColor(uptime),
        tooltip,
      }
    })
    .reverse()

  // Calculate overall uptime percentage
  const validMetrics = uptimes.map((m) => m.uptime).filter((m) => m !== undefined)
  const overallUptime = validMetrics.reduce((sum, m) => sum + m, 0) / validMetrics.length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm font-medium text-muted-foreground">UPTIME</div>
        {validMetrics.length > 0 && (
          <div className="font-mono text-sm">{overallUptime.toFixed(2)}%</div>
        )}
      </div>

      <Tracker data={slots} defaultBackgroundColor="bg-muted" />

      <div className="flex justify-between font-mono text-xs text-muted-foreground">
        <span>{hours}H AGO</span>
        <span>NOW</span>
      </div>
    </div>
  )
}

export const UptimeTracker = memo(UptimeTracker_)
