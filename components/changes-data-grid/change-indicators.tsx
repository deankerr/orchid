import * as R from 'remeda'

import { formatNumber, pricingFormats } from '@/lib/formatters'
import { cn } from '@/lib/utils'

import { Badge } from '../ui/badge'

export function AddIndicator({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span className={cn('text-success', className)} {...props}>
      +
    </span>
  )
}

export function RemoveIndicator({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span className={cn('text-destructive', className)} {...props}>
      -
    </span>
  )
}

export function CreateBadge({ className, ...props }: React.ComponentProps<typeof Badge>) {
  return (
    <Badge
      className={cn(
        'rounded-sm border-green-400/30 bg-green-900/30 text-sm text-green-400/90',
        className,
      )}
      {...props}
    >
      CREATE
    </Badge>
  )
}

export function DeleteBadge({ className, ...props }: React.ComponentProps<typeof Badge>) {
  return (
    <Badge
      className={cn(
        'rounded-sm border-red-400/30 bg-red-900/30 text-sm text-red-400/90 uppercase',
        className,
      )}
      {...props}
    >
      DELETE
    </Badge>
  )
}

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
      <Badge variant="outline" className="text-current">
        empty
      </Badge>
    )
  }

  if (value === true) {
    return (
      <Badge variant="outline" className="text-current">
        true
      </Badge>
    )
  }

  if (value === false) {
    return (
      <Badge variant="outline" className="text-current">
        false
      </Badge>
    )
  }

  return String(value)
}
