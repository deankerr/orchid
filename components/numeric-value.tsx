import * as R from 'remeda'

import type { Doc } from '@/convex/_generated/dataModel'

import { formatAbbreviation, formatNumber, pricingFormats } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface NumericValueProps {
  value?: number | null
  unit?: string
  digits?: number
  currency?: boolean
  transform?: (value: number) => number
  abbreviate?: boolean
  className?: string
}

/**
 * NumericValue formats and displays numeric values with optional units and transformations.
 * It handles null/undefined values gracefully and supports currency formatting.
 */
export function NumericValue({
  value,
  unit = '',
  digits = 0,
  currency = false,
  transform = R.identity(),
  abbreviate = false,
  className,
}: NumericValueProps) {
  const displayValue = R.when(value, R.isNumber, transform)

  return (
    <div className={cn('text-right', className)}>
      {currency && R.isNumber(displayValue) && (
        <span className="mr-0.5 text-[0.8em] text-foreground-dim">$</span>
      )}
      <span>
        {R.isNumber(displayValue)
          ? abbreviate
            ? formatAbbreviation(displayValue)
            : formatNumber(displayValue, digits)
          : ' - '}
      </span>
      {unit && (
        <span data-slot="unit" className="mx-0.5 text-[0.8em] text-foreground-dim">
          {unit}
        </span>
      )}
    </div>
  )
}

type Pricing = Doc<'or_endpoints'>['pricing']
type PricingField = keyof typeof pricingFormats

interface PricingPropertyProps {
  pricing: Pricing
  field: PricingField
  fallbackToZero?: boolean
  className?: string
}

/**
 * PricingProperty displays a specific pricing field with appropriate formatting.
 * It automatically applies the correct unit, transformation, and decimal places.
 */
export function PricingProperty({
  pricing,
  field,
  fallbackToZero,
  className,
}: PricingPropertyProps) {
  const format = pricingFormats[field]
  const value = pricing[field]

  return (
    <NumericValue
      value={value ?? (fallbackToZero ? 0 : undefined)}
      unit={format.unit}
      digits={format.digits}
      transform={format.transform}
      currency
      className={className}
    />
  )
}
