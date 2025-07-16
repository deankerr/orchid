import * as R from 'remeda'

import type { Doc } from '@/convex/_generated/dataModel'

import { NumericData } from './numeric-data'

type Pricing = Doc<'or_endpoints'>['pricing']

const toM = (v: number) => v * 1_000_000
const toK = (v: number) => v * 1_000
const toPercent = (v: number) => v * 100

export const pricingFieldConfig: Record<
  keyof Pricing,
  { unit: string; transform: (v: number) => number }
> = {
  input: { unit: '/MTOK', transform: toM },
  output: { unit: '/MTOK', transform: toM },
  reasoning_output: { unit: '/MTOK', transform: toM },
  cache_read: { unit: '/MTOK', transform: toM },
  cache_write: { unit: '/MTOK', transform: toM },
  image_input: { unit: '/KTOK', transform: toK },
  web_search: { unit: '', transform: R.identity() },
  per_request: { unit: '', transform: R.identity() },
  discount: { unit: '%', transform: toPercent },
}

export function EndpointPricing({ pricing, field }: { pricing: Pricing; field: keyof Pricing }) {
  const value = pricing[field]

  const { unit, transform } = pricingFieldConfig[field]
  const transformedValue = R.when(value, R.isNumber, transform)

  return (
    <>
      <NumericData unit={unit} digits={2} currency>
        {transformedValue}
      </NumericData>
    </>
  )
}
