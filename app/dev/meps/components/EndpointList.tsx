import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Clock, Zap } from 'lucide-react'
import { UptimeChart } from './UptimeChart'

interface EndpointListProps {
  endpoints: any[]
}

export function EndpointList({ endpoints }: EndpointListProps) {
  if (!endpoints.length) {
    return <div className="text-sm text-muted-foreground">No endpoints available</div>
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium">Endpoints</h4>
      <div className="space-y-3">
        {endpoints.map((endpoint, index) => (
          <EndpointCard key={endpoint.id || index} endpoint={endpoint} />
        ))}
      </div>
    </div>
  )
}

function EndpointCard({ endpoint }: { endpoint: any }) {
  const formatPrice = (price: string, type: 'token' | 'image' | 'request') => {
    const num = parseFloat(price)

    switch (type) {
      case 'token':
        // Convert per token to per million tokens
        const tokenPrice = num * 1000000
        return `$${tokenPrice % 1 === 0 ? tokenPrice.toFixed(0) : tokenPrice.toFixed(2)}/M`
      case 'image':
        // Convert per token to per thousand tokens
        const imagePrice = num * 1000
        return `$${imagePrice % 1 === 0 ? imagePrice.toFixed(0) : imagePrice.toFixed(2)}/K`
      case 'request':
        // Use as is, but format nicely
        return `$${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)}/req`
      default:
        return `$${num.toExponential(2)}`
    }
  }

  const hasCache = !!(endpoint.pricing?.inputCacheRead || endpoint.pricing?.inputCacheWrite)
  const inputPrice = formatPrice(endpoint.pricing?.prompt || '0', 'token')
  const outputPrice = formatPrice(endpoint.pricing?.completion || '0', 'token')

  return (
    <Card>
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between w-full">
              {/* Left: Provider name and region */}
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold">{endpoint.providerDisplayName}</div>
                {endpoint.providerRegion && (
                  <Badge variant="outline" className="text-xs">
                    {endpoint.providerRegion}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Right: Status badges */}
              <div className="flex gap-2">
                {endpoint.isFree && <Badge variant="secondary">Free</Badge>}
                {endpoint.moderationRequired && <Badge variant="default">Moderated</Badge>}
                {hasCache && <Badge variant="default">Cache</Badge>}
                {endpoint.isDeranked && <Badge variant="destructive">Deranked</Badge>}
              </div>
            </div>

            {/* Always visible core metrics */}
            <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-border">
              {/* Context */}
              <div>
                <div className="text-lg font-bold text-foreground">
                  {(endpoint.contextLength / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-muted-foreground">Context</div>
              </div>

              {/* Input Price */}
              <div>
                <div className="text-lg font-bold text-foreground">{inputPrice}</div>
                <div className="text-xs text-muted-foreground">Input</div>
              </div>

              {/* Output Price */}
              <div>
                <div className="text-lg font-bold text-foreground">{outputPrice}</div>
                <div className="text-xs text-muted-foreground">Output</div>
              </div>

              {/* Performance - show latency and throughput together */}
              <div>
                {endpoint.stats ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      <span className="font-semibold">
                        {((endpoint.stats.p50Latency || endpoint.stats.p50_latency || 0) / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <Zap className="h-3 w-3" />
                      <span className="font-semibold">
                        {(endpoint.stats.p50Throughput || endpoint.stats.p50_throughput || 0).toFixed(0)}{' '}
                        tok/s
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">No stats</div>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Technical Details Grid - collect all items first */}
            {(() => {
              const detailItems: Array<{ label: string; value: string | number }> = []

              if (endpoint.quantization) {
                detailItems.push({
                  label: 'Quantization',
                  value: endpoint.quantization,
                })
              }

              if (endpoint.maxPromptTokens) {
                detailItems.push({
                  label: 'Max Input',
                  value: endpoint.maxPromptTokens.toLocaleString(),
                })
              }

              if (endpoint.maxCompletionTokens) {
                detailItems.push({
                  label: 'Max Output',
                  value: endpoint.maxCompletionTokens.toLocaleString(),
                })
              }

              if (endpoint.maxPromptImages) {
                detailItems.push({
                  label: 'Max Images',
                  value: endpoint.maxPromptImages,
                })
              }

              if (endpoint.variant && endpoint.variant !== 'standard') {
                detailItems.push({
                  label: 'Variant',
                  value: endpoint.variant.charAt(0).toUpperCase() + endpoint.variant.slice(1),
                })
              }

              // Extended Pricing
              if (endpoint.pricing?.image && parseFloat(endpoint.pricing.image) > 0) {
                detailItems.push({
                  label: 'Image Price',
                  value: formatPrice(endpoint.pricing.image, 'image'),
                })
              }

              if (endpoint.pricing?.inputCacheRead && parseFloat(endpoint.pricing.inputCacheRead) > 0) {
                detailItems.push({
                  label: 'Cache Read',
                  value: formatPrice(endpoint.pricing.inputCacheRead, 'token'),
                })
              }

              if (endpoint.pricing?.inputCacheWrite && parseFloat(endpoint.pricing.inputCacheWrite) > 0) {
                detailItems.push({
                  label: 'Cache Write',
                  value: formatPrice(endpoint.pricing.inputCacheWrite, 'token'),
                })
              }

              if (endpoint.pricing?.internalReasoning && parseFloat(endpoint.pricing.internalReasoning) > 0) {
                detailItems.push({
                  label: 'Reasoning Price',
                  value: formatPrice(endpoint.pricing.internalReasoning, 'token'),
                })
              }

              if (detailItems.length === 0) return null

              return (
                <div className="grid grid-cols-4 gap-4 py-4 bg-muted/30 rounded-lg">
                  {detailItems.map((item, index) => (
                    <div key={index} className="text-center space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
                      <div className="text-sm font-semibold">{item.value}</div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Uptime and Capabilities Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Uptime Chart */}
              <div className="min-w-0">
                <UptimeChart uptime={endpoint.uptime} />
              </div>

              {/* Capabilities */}
              <div className="space-y-3">
                <div className="text-sm font-medium">Capabilities</div>
                <div className="flex flex-wrap gap-2">
                  {endpoint.hasCompletions && <Badge variant="secondary">Completions</Badge>}
                  {endpoint.hasChatCompletions && <Badge variant="secondary">Chat</Badge>}
                  {endpoint.canAbort && <Badge variant="outline">Cancelable</Badge>}
                  {endpoint.isByok && <Badge variant="outline">BYOK</Badge>}
                  {endpoint.supportedParameters?.includes('response_format') && (
                    <Badge variant="outline">Response Format</Badge>
                  )}
                  {endpoint.supportedParameters?.includes('structured_outputs') && (
                    <Badge variant="outline">Structured Outputs</Badge>
                  )}
                  {endpoint.supportedParameters?.includes('tools') && <Badge variant="outline">Tools</Badge>}
                  {endpoint.supportedParameters?.includes('tool_choice') && (
                    <Badge variant="outline">Tool Choice</Badge>
                  )}
                  {endpoint.supportedParameters?.includes('reasoning') && (
                    <Badge variant="outline">Reasoning</Badge>
                  )}
                  {endpoint.supportedParameters?.includes('include_reasoning') && (
                    <Badge variant="outline">Include Reasoning</Badge>
                  )}
                  {endpoint.supportedParameters?.includes('web_search_options') && (
                    <Badge variant="outline">Web Search</Badge>
                  )}
                  {endpoint.variablePricings && endpoint.variablePricings.length > 0 && (
                    <Badge variant="default">Variable Pricing</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Raw Data (for debugging) */}
            <details>
              <summary className="cursor-pointer text-xs font-medium mb-2 text-muted-foreground">
                Raw Endpoint Data
              </summary>
              <div className="max-w-full overflow-hidden">
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48 max-w-full whitespace-pre-wrap break-all">
                  {JSON.stringify(endpoint, null, 2)}
                </pre>
              </div>
            </details>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
