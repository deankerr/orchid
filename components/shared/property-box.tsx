import type { Doc } from '@/convex/_generated/dataModel'

import { pricingFormats } from '@/lib/formatters'
import { cn } from '@/lib/utils'

import { NumericValue } from './numeric-value'

/**
 * PropertyBox displays a labeled property value in a consistent box format.
 * This is the base component for displaying any kind of property in our UI.
 */
export function PropertyBox({
  label,
  children,
  className,
  ...props
}: { label: string } & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex min-w-36 flex-col gap-1.5 bg-muted p-2.5 pl-4 text-[15px] uppercase',
        className,
      )}
      {...props}
    >
      <div className="-ml-1.5 text-left text-[10px] uppercase">{label}</div>
      {children}
    </div>
  )
}

interface NumericPropertyBoxProps {
  label: string
  value?: number | null
  unit?: string
  digits?: number
  currency?: boolean
  transform?: (value: number) => number
  className?: string
}

/**
 * NumericProperty combines PropertyBox and NumericValue for the common pattern
 * of displaying labeled numeric values with units and formatting.
 */
export function NumericPropertyBox({
  label,
  value,
  unit = '',
  digits = 0,
  currency = false,
  transform,
  className,
}: NumericPropertyBoxProps) {
  return (
    <PropertyBox label={label} className={className}>
      <NumericValue
        value={value}
        unit={unit}
        digits={digits}
        currency={currency}
        transform={transform}
      />
    </PropertyBox>
  )
}

type Pricing = Doc<'or_endpoints'>['pricing']
type PricingField = keyof typeof pricingFormats

interface PricingPropertyProps {
  label: string
  pricing: Pricing
  field: PricingField
  className?: string
}

/**
 * PricingProperty displays a specific pricing field with appropriate formatting.
 * It automatically applies the correct unit, transformation, and decimal places.
 */
export function PricingPropertyBox({ label, pricing, field, className }: PricingPropertyProps) {
  const format = pricingFormats[field]
  const value = pricing[field]

  return (
    <NumericPropertyBox
      label={label}
      value={value}
      unit={format.unit}
      digits={format.digits}
      transform={format.transform}
      currency
      className={className}
    />
  )
}
