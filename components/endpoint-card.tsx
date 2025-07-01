import type { OrEndpoint, OrEndpointMetric, OrEndpointUptimeMetric } from '@/convex/types'

import { formatTokenPriceToK, formatTokenPriceToM } from '@/lib/utils'

import { DataField } from './data-field'
import ProviderIcon from './provider-icon'
import { Badge } from './ui/badge'
import { UptimeTracker } from './uptime-tracker'

export function EndpointCard({
  endpoint,
}: {
  endpoint: OrEndpoint & { metrics: OrEndpointMetric[]; uptime: OrEndpointUptimeMetric[] }
}) {
  const { output_tokens, ...limits } = endpoint.limits

  return (
    <div className="flex flex-col gap-6 rounded-sm border px-6 py-6 font-mono">
      <div className="flex flex-wrap items-center gap-2.5 text-sm">
        <ProviderIcon provider={endpoint.provider_id} />
        {endpoint.provider_name}

        {endpoint.model_variant !== 'standard' && (
          <Badge variant="default">{endpoint.model_variant}</Badge>
        )}

        {endpoint.status < 0 ? <Badge variant="destructive">deranked</Badge> : null}
        {endpoint.is_disabled ? <Badge variant="destructive">disabled</Badge> : null}
      </div>

      <div className="flex flex-wrap gap-6">
        <DataField label="context_length">{endpoint.context_length.toLocaleString()}</DataField>

        <DataField label="max_output">
          {(output_tokens ?? endpoint.context_length).toLocaleString()}
        </DataField>

        {Object.entries(pricingMap).map(([key, formatter]) => {
          const value = endpoint.pricing[key as keyof typeof endpoint.pricing]

          if (value === undefined) return null

          return (
            <DataField key={key} label={key}>
              {formatter(value)}
            </DataField>
          )
        })}

        {Object.entries(limits).map(([key, value]) => (
          <DataField key={key} label={key}>
            {value.toLocaleString()}
          </DataField>
        ))}

        {endpoint.quantization && (
          <DataField label="quantization">{endpoint.quantization}</DataField>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="text-sm font-medium text-muted-foreground">attributes</div>

        <div className="flex flex-wrap gap-2">
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
        <div className="text-sm font-medium text-muted-foreground">supported_parameters</div>
        <div className="flex flex-wrap gap-2">
          {endpoint.supported_parameters.map((parameter) => (
            <Badge key={parameter} variant="secondary">
              {parameter}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-sm font-medium text-muted-foreground">metrics</div>

        <div className="flex flex-wrap gap-4">
          <DataField label="p50_latency">
            {`${endpoint.metrics[0]?.p50_latency.toLocaleString() ?? '—'} ms`}
          </DataField>

          <DataField label="p50_throughput">
            {`${endpoint.metrics[0]?.p50_throughput.toFixed(2) ?? '—'} tps`}
          </DataField>

          <DataField label="request_count">
            {endpoint.metrics[0]?.request_count.toLocaleString() ?? '—'}
          </DataField>
        </div>
      </div>

      <div className="max-w-lg">
        <UptimeTracker uptimes={endpoint.uptime} />
      </div>

      <code className="text-xs text-muted-foreground">{endpoint.uuid}</code>

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
