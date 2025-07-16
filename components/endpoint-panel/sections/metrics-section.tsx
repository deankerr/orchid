import * as R from 'remeda'

import type { Endpoint } from '@/hooks/api'

import { DataField } from '../data-field'
import { NumericData } from '../numeric-data'

export function MetricsSection({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="flex flex-wrap gap-3">
      <DataField label="context">
        <NumericData unit="TOK">{endpoint.context_length}</NumericData>
      </DataField>

      <DataField label="max output">
        <NumericData unit="TOK">{endpoint.limits.output_tokens}</NumericData>
      </DataField>

      <DataField label="throughput">
        <NumericData unit="TOK/S">{endpoint.stats?.p50_throughput}</NumericData>
      </DataField>

      <DataField label="latency">
        <NumericData unit="MS">{endpoint.stats?.p50_latency}</NumericData>
      </DataField>

      <DataField label="traffic">
        <NumericData unit="%">
          {R.when(endpoint.traffic_share, R.isNumber, R.multiply(100))}
        </NumericData>
      </DataField>
    </div>
  )
}
