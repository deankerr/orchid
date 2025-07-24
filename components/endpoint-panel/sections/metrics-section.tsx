import type { Endpoint } from '@/hooks/api'
import { metricFormats } from '@/lib/formatters'

import { NumericPropertyBox, PropertyBox } from '../../shared/property-box'

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
        unit="S"
        digits={2}
        transform={(value) => value / 1000}
      />

      {endpoint.status < 0 && (
        <PropertyBox label="status">
          <span className="text-warning">deranked</span>
        </PropertyBox>
      )}
    </div>
  )
}
