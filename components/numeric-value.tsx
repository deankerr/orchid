import * as R from 'remeda'

function formatNumber(value: number, decimals: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

interface NumericValueProps {
  value?: number | null
  unit?: string
  digits?: number
  currency?: boolean
  transform?: (value: number) => number
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
}: NumericValueProps) {
  const displayValue = R.when(value, R.isNumber, transform)

  return (
    <div className="text-right">
      {currency && <span className="mr-0.5 text-[15px]">$</span>}
      <span>{R.isNumber(displayValue) ? formatNumber(displayValue, digits) : ' - '}</span>
      {unit && <span className="mx-0.5 text-xs text-foreground-dim">{unit}</span>}
    </div>
  )
}
