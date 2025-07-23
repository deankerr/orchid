import * as R from 'remeda'

import type { Doc } from '@/convex/_generated/dataModel'

import { PricingPropertyBox } from '../../shared/property-box'

type Pricing = Doc<'or_endpoints'>['pricing']

export function PricingSection({ pricing }: { pricing: Pricing }) {
  return (
    <div className="flex flex-wrap gap-3">
      <PricingPropertyBox label="input" pricing={pricing} field="input" />
      <PricingPropertyBox label="output" pricing={pricing} field="output" />

      {R.isDefined(pricing.image_input) && (
        <PricingPropertyBox label="image" pricing={pricing} field="image_input" />
      )}

      {R.isDefined(pricing.reasoning_output) && (
        <PricingPropertyBox label="reasoning" pricing={pricing} field="reasoning_output" />
      )}

      {R.isDefined(pricing.cache_read) && (
        <PricingPropertyBox label="cache read" pricing={pricing} field="cache_read" />
      )}

      {R.isDefined(pricing.cache_write) && (
        <PricingPropertyBox label="cache write" pricing={pricing} field="cache_write" />
      )}

      {R.isDefined(pricing.web_search) && (
        <PricingPropertyBox label="web search" pricing={pricing} field="web_search" />
      )}

      {R.isDefined(pricing.per_request) && (
        <PricingPropertyBox label="per request" pricing={pricing} field="per_request" />
      )}

      {R.isDefined(pricing.discount) && (
        <PricingPropertyBox label="discount" pricing={pricing} field="discount" />
      )}
    </div>
  )
}
