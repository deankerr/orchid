import * as R from 'remeda'

import type { Endpoint } from '@/hooks/api'
import { cn } from '@/lib/utils'

import { NumericPropertyBox, PropertyBox } from '../../property-box'

export function DataPolicySection({ dataPolicy }: { dataPolicy: Endpoint['data_policy'] }) {
  return (
    <div className="flex flex-wrap gap-3">
      <PropertyBox label="training">
        <span className={cn(dataPolicy.training && 'text-warning')}>
          {String(dataPolicy.training).toUpperCase()}
        </span>
      </PropertyBox>

      {R.isDefined(dataPolicy.retains_prompts) && (
        <PropertyBox label="retains prompts">
          <span className={cn(dataPolicy.retains_prompts && 'text-warning')}>
            {String(dataPolicy.retains_prompts).toUpperCase()}
          </span>
        </PropertyBox>
      )}

      {R.isDefined(dataPolicy.retention_days) && (
        <NumericPropertyBox label="retention days" value={dataPolicy.retention_days} unit="" />
      )}

      {R.isDefined(dataPolicy.requires_user_ids) && (
        <PropertyBox label="requires user ids">
          <span className={cn(dataPolicy.requires_user_ids && 'text-warning')}>
            {String(dataPolicy.requires_user_ids).toUpperCase()}
          </span>
        </PropertyBox>
      )}

      {R.isDefined(dataPolicy.can_publish) && (
        <PropertyBox label="can publish">
          <span className={cn(dataPolicy.can_publish && 'text-warning')}>
            {String(dataPolicy.can_publish).toUpperCase()}
          </span>
        </PropertyBox>
      )}
    </div>
  )
}
