import type { Endpoint } from '@/hooks/api'

import { Badge } from '../../ui/badge'
import { DataField } from '../data-field'

export function CapabilitiesSection({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="flex flex-wrap gap-3">
      <DataField label="quantization">
        {endpoint.quantization ? (
          <Badge variant="outline" className="rounded-sm uppercase">
            {endpoint.quantization}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground uppercase">no data</span>
        )}
      </DataField>

      {endpoint.capabilities.completions && <DataField label="endpoint">COMPLETIONS</DataField>}
      {endpoint.capabilities.chat_completions && <DataField label="endpoint">CHAT</DataField>}
      {endpoint.capabilities.tools && <DataField label="parameters">TOOLS</DataField>}
    </div>
  )
}
