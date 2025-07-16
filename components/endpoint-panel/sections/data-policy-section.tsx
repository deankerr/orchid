import * as R from 'remeda'

import type { Endpoint } from '@/hooks/api'
import { cn } from '@/lib/utils'

import { DataField } from '../data-field'
import { NumericData } from '../numeric-data'

const colorWarning = 'bg-orange-300/70 dark:bg-orange-400/60'
const colorAlert = 'bg-red-300/70 dark:bg-red-400/60'

export function DataPolicySection({ dataPolicy }: { dataPolicy: Endpoint['data_policy'] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {R.isDefined(dataPolicy.training) && (
        <DataField label="training" className={cn(dataPolicy.training && colorAlert)}>
          {String(dataPolicy.training).toUpperCase()}
        </DataField>
      )}

      {R.isDefined(dataPolicy.retains_prompts) && (
        <DataField
          label="retains prompts"
          className={cn(dataPolicy.retains_prompts && colorWarning)}
        >
          {String(dataPolicy.retains_prompts).toUpperCase()}
        </DataField>
      )}

      {R.isDefined(dataPolicy.retention_days) && (
        <DataField label="retention days" className={cn(dataPolicy.retention_days && colorWarning)}>
          <NumericData unit="">{dataPolicy.retention_days}</NumericData>
        </DataField>
      )}

      {R.isDefined(dataPolicy.requires_user_ids) && (
        <DataField
          label="requires user ids"
          className={cn(dataPolicy.requires_user_ids && colorWarning)}
        >
          {String(dataPolicy.requires_user_ids).toUpperCase()}
        </DataField>
      )}

      {R.isDefined(dataPolicy.can_publish) && (
        <DataField label="can publish" className={cn(dataPolicy.can_publish && colorAlert)}>
          {String(dataPolicy.can_publish).toUpperCase()}
        </DataField>
      )}
    </div>
  )
}
