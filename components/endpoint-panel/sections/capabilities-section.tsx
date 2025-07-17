import type { Endpoint } from '@/hooks/api'

import { PropertyBox } from '../../property-box'

export function CapabilitiesSection({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="flex flex-wrap gap-3">
      <PropertyBox label="quantization">
        {endpoint.quantization?.toUpperCase() ?? (
          <span className="text-foreground-dim uppercase">no data</span>
        )}
      </PropertyBox>

      {endpoint.capabilities.completions && <PropertyBox label="endpoint">COMPLETIONS</PropertyBox>}
      {endpoint.capabilities.chat_completions && <PropertyBox label="endpoint">CHAT</PropertyBox>}
      {endpoint.capabilities.tools && <PropertyBox label="parameters">TOOLS</PropertyBox>}
    </div>
  )
}
