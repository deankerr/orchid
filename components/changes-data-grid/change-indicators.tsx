import * as R from 'remeda'

import { formatNumber, pricingFormats } from '@/lib/formatters'
import { cn } from '@/lib/utils'

import { Badge } from '../ui/badge'

export function AddIndicator({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span className={cn('text-positive-outline', className)} {...props}>
      +
    </span>
  )
}

export function RemoveIndicator({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span className={cn('text-negative-outline', className)} {...props}>
      -
    </span>
  )
}

export function CreateBadge({ className, ...props }: React.ComponentProps<typeof Badge>) {
  return (
    <Badge
      className={cn(
        'border-positive-surface-border bg-positive-surface text-sm text-positive-surface-foreground',
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
        'border-negative-surface-border bg-negative-surface text-sm text-negative-surface-foreground',
        className,
      )}
      {...props}
    >
      DELETE
    </Badge>
  )
}

export function PercentageBadge({
  value,
  className,
  ...props
}: { value: number | null } & React.ComponentProps<typeof Badge>) {
  if (value === null || !isFinite(value)) {
    return null
  }

  const type = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'

  return (
    <Badge
      className={cn(
        'text-sm',
        type === 'positive' && 'bg-positive-soft text-positive-soft-foreground',
        type === 'negative' && 'bg-negative-soft text-negative-soft-foreground',

        className,
      )}
      variant={type === 'neutral' ? 'outline' : 'default'}
      {...props}
    >
      {value > 0 ? '+' : ''}
      {value.toFixed(1)}%
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
