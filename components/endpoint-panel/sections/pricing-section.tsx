import * as R from 'remeda'

import type { Doc } from '@/convex/_generated/dataModel'

import { DataField } from '../data-field'
import { EndpointPricing } from '../endpoint-pricing'

type Pricing = Doc<'or_endpoints'>['pricing']

export function PricingSection({ pricing }: { pricing: Pricing }) {
  return (
    <div className="flex flex-wrap gap-3">
      <DataField label="input">
        <EndpointPricing pricing={pricing} field="input" />
      </DataField>

      <DataField label="output">
        <EndpointPricing pricing={pricing} field="output" />
      </DataField>

      {R.isDefined(pricing.image_input) && (
        <DataField label="image">
          <EndpointPricing pricing={pricing} field="image_input" />
        </DataField>
      )}

      {R.isDefined(pricing.reasoning_output) && (
        <DataField label="reasoning">
          <EndpointPricing pricing={pricing} field="reasoning_output" />
        </DataField>
      )}

      {R.isDefined(pricing.cache_read) && (
        <DataField label="cache read">
          <EndpointPricing pricing={pricing} field="cache_read" />
        </DataField>
      )}

      {R.isDefined(pricing.cache_write) && (
        <DataField label="cache write">
          <EndpointPricing pricing={pricing} field="cache_write" />
        </DataField>
      )}

      {R.isDefined(pricing.web_search) && (
        <DataField label="web search">
          <EndpointPricing pricing={pricing} field="web_search" />
        </DataField>
      )}

      {R.isDefined(pricing.per_request) && (
        <DataField label="per request">
          <EndpointPricing pricing={pricing} field="per_request" />
        </DataField>
      )}

      {R.isDefined(pricing.discount) && (
        <DataField label="discount">
          <EndpointPricing pricing={pricing} field="discount" />
        </DataField>
      )}
    </div>
  )
}
