import * as R from 'remeda'

import type { Endpoint } from '@/hooks/api'
import { cn } from '@/lib/utils'

import { NumericPropertyBox, PropertyBox } from '../../property-box'

const colorWarning = 'bg-orange-300/70 dark:bg-orange-400/60'
const colorAlert = 'bg-red-300/70 dark:bg-red-400/60'

export function DataPolicySection({ dataPolicy }: { dataPolicy: Endpoint['data_policy'] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {R.isDefined(dataPolicy.training) && (
        <PropertyBox label="training" className={cn(dataPolicy.training && colorAlert)}>
          {String(dataPolicy.training).toUpperCase()}
        </PropertyBox>
      )}

      {R.isDefined(dataPolicy.retains_prompts) && (
        <PropertyBox
          label="retains prompts"
          className={cn(dataPolicy.retains_prompts && colorWarning)}
        >
          {String(dataPolicy.retains_prompts).toUpperCase()}
        </PropertyBox>
      )}

      {R.isDefined(dataPolicy.retention_days) && (
        <NumericPropertyBox
          label="retention days"
          value={dataPolicy.retention_days}
          unit=""
          className={cn(dataPolicy.retention_days && colorWarning)}
        />
      )}

      {R.isDefined(dataPolicy.requires_user_ids) && (
        <PropertyBox
          label="requires user ids"
          className={cn(dataPolicy.requires_user_ids && colorWarning)}
        >
          {String(dataPolicy.requires_user_ids).toUpperCase()}
        </PropertyBox>
      )}

      {R.isDefined(dataPolicy.can_publish) && (
        <PropertyBox label="can publish" className={cn(dataPolicy.can_publish && colorAlert)}>
          {String(dataPolicy.can_publish).toUpperCase()}
        </PropertyBox>
      )}
    </div>
  )
}
