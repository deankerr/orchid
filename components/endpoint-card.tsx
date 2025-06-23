import { getHourAlignedTimestamp } from '@/convex/shared'
import type { OrEndpoint, OrEndpointMetric, OrEndpointUptimeMetric } from '@/convex/types'

import { formatTimestampToYMDHM, formatTokenPriceToK, formatTokenPriceToM } from '@/lib/utils'

import { Tracker } from './tracker'
import { Badge } from './ui/badge'

function UptimeTracker({ uptimes }: { uptimes: OrEndpointUptimeMetric[] }) {
  const hours = 72
  const hourMs = 60 * 60 * 1000
  const now = getHourAlignedTimestamp()

  const getColor = (value?: number) => {
    if (value === undefined) return
    if (value === 100) return 'bg-emerald-500'
    if (value >= 85) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  const slots = [...Array(hours)]
    .map((_, i) => {
      const timestamp = now - hourMs * i
      const uptime = uptimes.find((m) => m.timestamp === timestamp)?.uptime
      const timeString = formatTimestampToYMDHM(timestamp)
      const tooltip = `${timeString} - ${uptime === undefined ? 'no data' : uptime.toFixed(1) + '%'}`

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
        <div className="text-sm font-medium text-muted-foreground font-mono">uptime</div>
        {validMetrics.length > 0 && (
          <div className="text-sm font-mono">{overallUptime.toFixed(1)}%</div>
        )}
      </div>

      <Tracker data={slots} defaultBackgroundColor="bg-muted" />

      <div className="flex justify-between text-xs text-muted-foreground font-mono">
        <span>48h ago</span>
        <span>now</span>
      </div>
    </div>
  )
}

export function EndpointCard({
  endpoint,
}: {
  endpoint: OrEndpoint & { metrics: OrEndpointMetric[]; uptime: OrEndpointUptimeMetric[] }
}) {
  const { output_tokens, ...limits } = endpoint.limits

  return (
    <div className="border rounded-sm flex flex-col gap-6 py-6 px-6">
      <div className="font-medium flex flex-wrap gap-2">
        {endpoint.provider_name}

        {endpoint.model_variant !== 'standard' && (
          <Badge variant="default" className="font-mono">
            {endpoint.model_variant}
          </Badge>
        )}

        {endpoint.status < 0 ? (
          <Badge variant="destructive" className="font-mono">
            deranked
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-4 font-mono">
        <div className="flex flex-col gap-1">
          <div className="text-sm text-muted-foreground">context_length</div>
          <div>{endpoint.context_length.toLocaleString()}</div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-sm text-muted-foreground">max_output</div>
          <div>{(output_tokens ?? endpoint.context_length).toLocaleString()}</div>
        </div>

        {Object.entries(pricingMap).map(([key, formatter]) => {
          const value = endpoint.pricing[key as keyof typeof endpoint.pricing]

          if (value === undefined) return null

          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="text-sm text-muted-foreground">{key}</div>
              <div>{formatter(value)}</div>
            </div>
          )
        })}

        {Object.entries(limits).map(([key, value]) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground">{key}</div>
            <div>{value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="text-sm font-medium text-muted-foreground font-mono">attributes</div>

        <div className="flex flex-wrap gap-2 font-mono">
          {Object.entries(endpoint.capabilities).map(([key, value]) =>
            value ? (
              <Badge variant="secondary" key={key}>
                {key}
              </Badge>
            ) : null,
          )}

          {endpoint.is_moderated && <Badge variant="destructive">moderated</Badge>}

          {Object.entries(endpoint.data_policy).map(([key, value]) =>
            value ? (
              <Badge variant="destructive" key={key}>
                {key} {value}
              </Badge>
            ) : null,
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-sm font-medium text-muted-foreground font-mono">
          supported_parameters
        </div>
        <div className="flex flex-wrap gap-2 font-mono">
          {endpoint.supported_parameters.map((parameter) => (
            <Badge key={parameter} variant="secondary">
              {parameter}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-sm font-medium text-muted-foreground font-mono">metrics</div>

        <div className="flex flex-wrap gap-4 font-mono">
          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground">p50_latency</div>
            <div>{endpoint.metrics[0]?.p50_latency.toLocaleString()} ms</div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground">p50_throughput</div>
            <div>{endpoint.metrics[0]?.p50_throughput.toFixed(2)} tps</div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground">request_count</div>
            <div>{endpoint.metrics[0]?.request_count.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="max-w-xl">
        <UptimeTracker uptimes={endpoint.uptime} />
      </div>

      {/* <pre className="text-xs text-muted-foreground">{JSON.stringify(endpoint, null, 2)}</pre> */}
    </div>
  )
}

const pricingMap: Record<string, (value: number) => string> = {
  input: (value) => formatTokenPriceToM(value),
  output: (value) => formatTokenPriceToM(value),
  image_input: (value) => formatTokenPriceToK(value),
  reasoning_output: (value) => formatTokenPriceToM(value),
  cache_read: (value) => formatTokenPriceToM(value),
  cache_write: (value) => formatTokenPriceToM(value),

  web_search: (value) => value.toString(),
  per_request: (value) => value.toString(),

  discount: (value) => `${value * 100}%`,
}
