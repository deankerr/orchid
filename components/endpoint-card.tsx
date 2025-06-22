import type { OrEndpoint } from '@/convex/types'

import { formatTokenPriceToK, formatTokenPriceToM } from '@/lib/utils'

import { Badge } from './ui/badge'

export function EndpointCard({ endpoint }: { endpoint: OrEndpoint }) {
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
