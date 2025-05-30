import type { Doc } from '@/convex/_generated/dataModel'

export function BulkEndpoint({ endpoint }: { endpoint: Doc<'endpoints'> }) {
  // Format pricing for display
  const formatPrice = (price: string, type: 'token' | 'request') => {
    const num = parseFloat(price)
    if (type === 'token') {
      // Convert to per million tokens
      return `$${(num * 1000000).toFixed(2)}/M`
    }
    return `$${num.toFixed(2)}/req`
  }

  const renderOptional = (value: string | number | boolean | undefined | null) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground/60 italic">null</span>
    }
    return String(value)
  }

  // Collect capability flags
  const caps = []
  if (endpoint.capabilities.completion) caps.push('completion')
  if (endpoint.capabilities.chat) caps.push('chat')
  if (endpoint.capabilities.imageInput) caps.push('image')
  if (endpoint.capabilities.fileInput) caps.push('file')
  if (endpoint.capabilities.reasoning) caps.push('reasoning')
  if (endpoint.capabilities.tools) caps.push('tools')
  if (endpoint.capabilities.multipart) caps.push('multipart')
  if (endpoint.capabilities.cancellation) caps.push('cancel')
  if (endpoint.capabilities.byok) caps.push('byok')
  if (endpoint.orModerated) caps.push('moderated')

  const isDeranked = endpoint.status !== undefined && endpoint.status < 0

  return (
    <div className="border bg-muted/20 p-2 text-xs font-mono">
      {/* Main info row */}
      <div className="flex items-start gap-2 mb-1 ml-32">
        <span className="font-semibold">{endpoint.name}</span>
        {endpoint.variant !== 'standard' && <span className="text-blue-600">[{endpoint.variant}]</span>}
        {endpoint.isDisabled && <span className="text-red-600">[disabled]</span>}
        {isDeranked && <span className="text-orange-600">[deranked]</span>}
      </div>

      {/* Technical details in a compact grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs ml-32">
        {/* Left column */}
        <div className="space-y-0.5">
          <div>
            <span className="text-muted-foreground">provider:</span> {endpoint.providerName}
          </div>
          <div>
            <span className="text-muted-foreground">context:</span> {endpoint.contextLength.toLocaleString()}
          </div>
          <div>
            <span className="text-muted-foreground">quantization:</span>{' '}
            {renderOptional(endpoint.quantization)}
          </div>
          <div>
            <span className="text-muted-foreground">pricing:</span>{' '}
            {formatPrice(endpoint.pricing.input, 'token')} / {formatPrice(endpoint.pricing.output, 'token')}
          </div>
          <div>
            <span className="text-muted-foreground">image_pricing:</span>{' '}
            {endpoint.pricing.imageInput
              ? formatPrice(endpoint.pricing.imageInput, 'token')
              : renderOptional(null)}
          </div>
          <div>
            <span className="text-muted-foreground">cache_read:</span>{' '}
            {endpoint.pricing.cacheRead
              ? formatPrice(endpoint.pricing.cacheRead, 'token')
              : renderOptional(null)}
          </div>
          <div>
            <span className="text-muted-foreground">cache_write:</span>{' '}
            {endpoint.pricing.cacheWrite
              ? formatPrice(endpoint.pricing.cacheWrite, 'token')
              : renderOptional(null)}
          </div>
          <div>
            <span className="text-muted-foreground">reasoning:</span>{' '}
            {endpoint.pricing.reasoningOutput
              ? formatPrice(endpoint.pricing.reasoningOutput, 'token')
              : renderOptional(null)}
          </div>
          <div>
            <span className="text-muted-foreground">max_input:</span>{' '}
            {renderOptional(endpoint.limits.inputTokens?.toLocaleString())}
          </div>
          <div>
            <span className="text-muted-foreground">max_output:</span>{' '}
            {renderOptional(endpoint.limits.outputTokens?.toLocaleString())}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-0.5">
          <div>
            <span className="text-muted-foreground">caps:</span> {caps.join(', ') || 'none'}
          </div>
          <div>
            <span className="text-muted-foreground">status:</span> {renderOptional(endpoint.status)}
          </div>
          <div>
            <span className="text-muted-foreground">max_images:</span>{' '}
            {renderOptional(endpoint.limits.imagesPerPrompt)}
          </div>
          <div>
            <span className="text-muted-foreground">tokens_per_image:</span>{' '}
            {renderOptional(endpoint.limits.tokensPerImage)}
          </div>
          <div>
            <span className="text-muted-foreground">training:</span>{' '}
            {renderOptional(endpoint.dataPolicy.training)}
          </div>
          <div>
            <span className="text-muted-foreground">retains_prompts:</span>{' '}
            {renderOptional(endpoint.dataPolicy.retainsPrompts)}
          </div>
          <div>
            <span className="text-muted-foreground">retention_days:</span>{' '}
            {renderOptional(endpoint.dataPolicy.retentionDays)}
          </div>
        </div>
      </div>

      {/* Supported parameters if any */}
      <div className="mt-1 text-xs ml-32">
        <span className="text-muted-foreground">params:</span> {endpoint.supportedParameters.join(', ')}
      </div>

      {/* UUID */}
      <div className="mt-1 text-xs ml-32">
        <span className="text-muted-foreground">uuid:</span> {endpoint.uuid}
      </div>
    </div>
  )
}
