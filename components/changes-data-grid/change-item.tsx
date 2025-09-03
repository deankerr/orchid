import * as R from 'remeda'

import { formatNumber, pricingFormats } from '@/lib/formatters'

import { Badge } from '../ui/badge'

// Field mapping from raw pricing field names to formatted field names
type PricingField = keyof typeof pricingFormats

const pricingFieldMapping: Record<string, PricingField> = {
  prompt: 'input',
  completion: 'output',
  image: 'image_input',
  internal_reasoning: 'reasoning_output',
  request: 'per_request',
  cache_read: 'cache_read',
  cache_write: 'cache_write',
  web_search: 'web_search',
  discount: 'discount',
}

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
      const pricingField = (pricingFieldMapping[keyName] as PricingField) || 'input'
      const format = pricingFormats[pricingField]
      const transformedValue = format.transform(numericValue)
      const formattedValue = formatNumber(transformedValue, format.digits)
      return `$${formattedValue}${format.unit}`
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
