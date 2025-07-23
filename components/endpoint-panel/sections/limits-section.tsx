import type { Endpoint } from '@/hooks/api'
import { metricFormats } from '@/lib/formatters'

import { NumericPropertyBox } from '../../shared/property-box'

export function LimitsSection({ limits }: { limits: Endpoint['limits'] }) {
  return (
    <div className="flex flex-wrap gap-3 empty:hidden">
      {limits.input_tokens && (
        <NumericPropertyBox
          label="max input"
          value={limits.input_tokens}
          unit={metricFormats.tokens.unit}
          digits={metricFormats.tokens.digits}
        />
      )}

      {limits.images_per_prompt && (
        <NumericPropertyBox
          label="images per prompt"
          value={limits.images_per_prompt}
          unit={metricFormats.count.unit}
          digits={metricFormats.count.digits}
        />
      )}

      {limits.tokens_per_image && (
        <NumericPropertyBox
          label="tokens per image"
          value={limits.tokens_per_image}
          unit={metricFormats.tokens.unit}
          digits={metricFormats.tokens.digits}
        />
      )}

      {limits.rpm && (
        <NumericPropertyBox
          label="requests per minute"
          value={limits.rpm}
          unit={metricFormats.count.unit}
          digits={metricFormats.count.digits}
        />
      )}

      {limits.rpd && (
        <NumericPropertyBox
          label="requests per day"
          value={limits.rpd}
          unit={metricFormats.count.unit}
          digits={metricFormats.count.digits}
        />
      )}
    </div>
  )
}
