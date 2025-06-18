import type { Doc } from '@/convex/_generated/dataModel'

export function BulkEndpoint({ endpoint }: { endpoint: Doc<'endpoint_views'> }) {
  // Format pricing for display
  const formatPrice = (price: number, type: 'token' | 'request' | 'image') => {
    if (type === 'token') {
      // Convert to per million tokens
      return `$${(price * 1000000).toFixed(2)}/M`
    }
    if (type === 'image') {
      // Convert to per thousand tokens
      return `$${(price * 1000).toFixed(2)}/K`
    }
    return `$${price.toFixed(2)}/req`
  }

  const renderOptional = (value: string | number | boolean | undefined | null) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground/60 italic">null</span>
    }
    return String(value)
  }

  // Collect capability flags
  const caps = []
  if (endpoint.capabilities.completions) caps.push('completion')
  if (endpoint.capabilities.chat_completions) caps.push('chat')
  if (endpoint.capabilities.image_input) caps.push('image')
  if (endpoint.capabilities.file_input) caps.push('file')
  if (endpoint.capabilities.reasoning) caps.push('reasoning')
  if (endpoint.capabilities.tools) caps.push('tools')
  if (endpoint.capabilities.multipart_messages) caps.push('multipart')
  if (endpoint.capabilities.stream_cancellation) caps.push('cancel')
  if (endpoint.capabilities.byok) caps.push('byok')
  if (endpoint.is_moderated) caps.push('moderated')

  const isDeranked = endpoint.status < 0

  return (
    <div className="border bg-muted/20 p-2 text-xs font-mono">
      {/* Main info row */}
      <div className="flex items-start gap-2 mb-1 ml-32">
        <span className="font-semibold">{endpoint.name}</span>
        {endpoint.model_variant !== 'standard' && (
          <span className="text-blue-600">[{endpoint.model_variant}]</span>
        )}
        {endpoint.is_disabled && <span className="text-red-600">[disabled]</span>}
        {isDeranked && <span className="text-orange-600">[deranked]</span>}
      </div>

      {/* Technical details in a compact grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs ml-32">
        {/* Left column */}
        <div className="space-y-0.5">
          <div>
            <span className="text-muted-foreground">provider:</span> {endpoint.provider_name}
          </div>
          <div>
            <span className="text-muted-foreground">context:</span> {endpoint.context_length.toLocaleString()}
          </div>
          <div>
            <span className="text-muted-foreground">quantization:</span>{' '}
            {renderOptional(endpoint.quantization)}
          </div>
          <div>
            <span className="text-muted-foreground">pricing:</span>{' '}
            {formatPrice(endpoint.pricing.input ?? 0, 'token')} /{' '}
            {formatPrice(endpoint.pricing.output ?? 0, 'token')}
          </div>
          <div>
            <span className="text-muted-foreground">image_input:</span>{' '}
            {endpoint.pricing.image_input
              ? formatPrice(endpoint.pricing.image_input, 'image')
              : renderOptional(null)}
          </div>
          <div>
            <span className="text-muted-foreground">cache_read:</span>{' '}
            {endpoint.pricing.cache_read
              ? formatPrice(endpoint.pricing.cache_read, 'token')
              : renderOptional(null)}
          </div>
          <div>
            <span className="text-muted-foreground">cache_write:</span>{' '}
            {endpoint.pricing.cache_write
              ? formatPrice(endpoint.pricing.cache_write, 'token')
              : renderOptional(null)}
          </div>
          <div>
            <span className="text-muted-foreground">reasoning_output:</span>{' '}
            {endpoint.pricing.reasoning_output
              ? formatPrice(endpoint.pricing.reasoning_output, 'token')
              : renderOptional(null)}
          </div>
          <div>
            <span className="text-muted-foreground">max_input:</span>{' '}
            {renderOptional(endpoint.limits.input_tokens?.toLocaleString())}
          </div>
          <div>
            <span className="text-muted-foreground">max_output:</span>{' '}
            {renderOptional(endpoint.limits.output_tokens?.toLocaleString())}
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
            {renderOptional(endpoint.limits.images_per_prompt)}
          </div>
          <div>
            <span className="text-muted-foreground">tokens_per_image:</span>{' '}
            {renderOptional(endpoint.limits.tokens_per_image)}
          </div>
          <div>
            <span className="text-muted-foreground">training:</span>{' '}
            {renderOptional(endpoint.data_policy.training)}
          </div>
          <div>
            <span className="text-muted-foreground">retains_prompts:</span>{' '}
            {renderOptional(endpoint.data_policy.retains_prompts)}
          </div>
          <div>
            <span className="text-muted-foreground">retention_days:</span>{' '}
            {renderOptional(endpoint.data_policy.retention_days)}
          </div>
        </div>
      </div>

      {/* Supported parameters if any */}
      <div className="mt-1 text-xs ml-32">
        <span className="text-muted-foreground">params:</span> {endpoint.supported_parameters.join(', ')}
      </div>

      {/* UUID */}
      <div className="mt-1 text-xs ml-32">
        <span className="text-muted-foreground">uuid:</span> {endpoint.uuid}
      </div>
    </div>
  )
}
