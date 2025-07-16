import type { Endpoint } from '@/hooks/api'

import { DataField } from '../data-field'
import { NumericData } from '../numeric-data'

export function LimitsSection({ limits }: { limits: Endpoint['limits'] }) {
  return (
    <div className="flex flex-wrap gap-3 empty:hidden">
      {limits.input_tokens && (
        <DataField label="max input">
          <NumericData unit="TOK">{limits.input_tokens}</NumericData>
        </DataField>
      )}

      {limits.images_per_prompt && (
        <DataField label="images per prompt">
          <NumericData unit="">{limits.images_per_prompt}</NumericData>
        </DataField>
      )}

      {limits.tokens_per_image && (
        <DataField label="tokens per image">
          <NumericData unit="TOK">{limits.tokens_per_image}</NumericData>
        </DataField>
      )}

      {limits.rpm && (
        <DataField label="requests per minute">
          <NumericData unit="">{limits.rpm}</NumericData>
        </DataField>
      )}

      {limits.rpd && (
        <DataField label="requests per day">
          <NumericData unit="">{limits.rpd}</NumericData>
        </DataField>
      )}
    </div>
  )
}
