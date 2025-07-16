import * as R from 'remeda'

function formatNumber(value: number, decimals: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function NumericData({
  unit,
  children,
  digits = 0,
  currency = false,
}: {
  unit: string
  children?: number | null
  digits?: number
  currency?: boolean
}) {
  return (
    <div className="text-right">
      {currency && <span className="mr-0.5 text-[15px]">$</span>}
      <span>{R.isNumber(children) ? formatNumber(children, digits) : ' - '}</span>
      <span className="mx-0.5 text-xs text-muted-foreground">{unit}</span>
    </div>
  )
}
