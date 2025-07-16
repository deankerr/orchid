import type { Endpoint } from '@/hooks/api'
import { metricFormats, transforms } from '@/lib/formatters'

import { NumericPropertyBox } from '../../property-box'

export function MetricsSection({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="flex flex-wrap gap-3">
      <NumericPropertyBox
        label="context"
        value={endpoint.context_length}
        unit={metricFormats.tokens.unit}
        digits={metricFormats.tokens.digits}
      />

      <NumericPropertyBox
        label="max output"
        value={endpoint.limits.output_tokens}
        unit={metricFormats.tokens.unit}
        digits={metricFormats.tokens.digits}
      />

      <NumericPropertyBox
        label="throughput"
        value={endpoint.stats?.p50_throughput}
        unit={metricFormats.tokensPerSecond.unit}
        digits={metricFormats.tokensPerSecond.digits}
      />

      <NumericPropertyBox
        label="latency"
        value={endpoint.stats?.p50_latency}
        unit={metricFormats.milliseconds.unit}
        digits={metricFormats.milliseconds.digits}
      />

      <NumericPropertyBox
        label="traffic"
        value={endpoint.traffic_share}
        unit={metricFormats.percentage.unit}
        digits={metricFormats.percentage.digits}
        transform={transforms.toPercent}
      />
    </div>
  )
}
