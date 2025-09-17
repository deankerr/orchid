import * as R from 'remeda'

import { formatPrice } from '@/lib/formatters'

import { Badge } from '../ui/badge'

export function ChangeItemValue({
  value,
  keyName,
  parentKeyName,
}: {
  value: unknown
  keyName?: string
  parentKeyName?: string
}) {
  if (parentKeyName === 'pricing' && R.isString(value) && keyName) {
    const numericValue = parseFloat(value)

    if (!isNaN(numericValue)) {
      return formatPrice({ priceKey: keyName, priceValue: numericValue })
    }
  }

  if (R.isNumber(value)) {
    return value.toLocaleString()
  }

  if (value === '') {
    return (
      <Badge variant="outline" className="text-muted-foreground opacity-50">
        empty
      </Badge>
    )
  }

  if (value === true) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        true
      </Badge>
    )
  }

  if (value === false) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        false
      </Badge>
    )
  }

  if (value === undefined) {
    return (
      <Badge variant="outline" className="border-dashed text-muted-foreground">
        undefined
      </Badge>
    )
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}
