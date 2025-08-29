import React from 'react'

import { MinusIcon, PlusIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  parseChangeBody,
  type ParsedChangeShape,
  type UnknownShape,
  type ValueChange,
} from '@/lib/change-body-parser'
import { formatNumber, pricingFormats } from '@/lib/formatters'
import { calculatePercentageChange, cn } from '@/lib/utils'

type PricingField = keyof typeof pricingFormats

// Field mapping from raw pricing field names to formatted field names
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

/**
 * Component to render percentage change with appropriate styling
 */
function PercentageChange({ value }: { value: number | null }) {
  if (value === null || !isFinite(value)) {
    return null
  }

  return (
    <span
      className={cn(
        'font-medium',
        value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-muted-foreground',
      )}
    >
      {value > 0 ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  )
}

/**
 * Badge component with consistent styling and pricing-aware variants
 */
function ChangeBadge({
  children,
  icon,
  shape,
  className = '',
}: {
  children: React.ReactNode
  icon?: React.ReactNode
  shape?: ParsedChangeShape
  className?: string
}) {
  const isPricing = shape?.path.includes('pricing')
  const variant = isPricing ? 'secondary' : 'outline'

  return (
    <Badge variant={variant} className={cn('px-1 py-0', className)}>
      {icon}
      {children}
    </Badge>
  )
}

/**
 * Component to render array changes showing the field name and added/removed values
 */
export function ArrayChange({ shape }: { shape: ParsedChangeShape }) {
  if (shape.type !== 'array_change') return null

  const adds = shape.changes.filter((c) => c.type === 'ADD')
  const removes = shape.changes.filter((c) => c.type === 'REMOVE')

  const allChanges = [
    ...adds.map((c) => ({ type: 'ADD' as const, value: c.value })),
    ...removes.map((c) => ({ type: 'REMOVE' as const, value: c.value })),
  ]

  return (
    <div className="space-y-1">
      <div className="text-muted-foreground">{shape.key}</div>
      <div className="flex flex-wrap gap-1">
        {allChanges.map((change, idx) => (
          <div key={`${change.type}-${shape.key}-${idx}`}>
            <ChangeBadge
              shape={shape}
              icon={
                change.type === 'ADD' ? (
                  <PlusIcon className="mr-1 text-success" />
                ) : (
                  <MinusIcon className="mr-1 text-destructive" />
                )
              }
            >
              {change.value}
            </ChangeBadge>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Component to render value changes - typically just show the change type
 * For nested changes, might show old -> new values
 */
export function ValueChange({ shape }: { shape: ValueChange }) {
  const { changeType, key } = shape

  // For ADD/REMOVE actions, show key and value to make it clear the entire key-value pair was added/removed
  if (changeType === 'ADD') {
    return (
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">
          <span className="mr-1 text-success">+</span>
          {key}
        </div>
        <div>{formatValue(shape.newValue, shape)}</div>
      </div>
    )
  }

  if (changeType === 'REMOVE') {
    return (
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">
          <span className="mr-1 text-destructive">+</span>
          {key}
        </div>
        <div>{formatValue(shape.oldValue, shape)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="text-muted-foreground">{key}</div>
      <ValueUpdateDetails shape={shape} />
    </div>
  )
}

/**
 * Component to render value update details showing before -> after
 * Handles basic string and numeric types
 */
function ValueUpdateDetails({ shape }: { shape: ParsedChangeShape }) {
  if (shape.type !== 'value_change') return null

  const { oldValue, newValue } = shape
  const percentageChange = calculatePercentageChange(oldValue, newValue)

  // Check if values are numeric (numbers or numeric strings)
  const isOldNumeric =
    typeof oldValue === 'number' || (typeof oldValue === 'string' && !isNaN(parseFloat(oldValue)))
  const isNewNumeric =
    typeof newValue === 'number' || (typeof newValue === 'string' && !isNaN(parseFloat(newValue)))
  const isNumeric = isOldNumeric || isNewNumeric

  // For numeric changes, use a grid layout to align values
  if (isNumeric) {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr_1fr] items-center gap-2">
        <span className="text-right text-muted-foreground">{formatValue(oldValue, shape)}</span>
        <div className="shrink-0 text-muted-foreground">{'->'}</div>
        <span className="font-medium text-foreground">{formatValue(newValue, shape)}</span>
        <PercentageChange value={percentageChange} />
      </div>
    )
  }

  // Other changes
  return (
    <div className="flex items-center gap-1">
      <div className="text-muted-foreground">{formatValue(oldValue, shape)}</div>
      <div className="shrink-0 text-muted-foreground">{'->'}</div>
      <div className="text-foreground">{formatValue(newValue, shape)}</div>
    </div>
  )
}

/**
 * Format values for display with basic string/numeric handling and pricing support
 */
function formatValue(value: unknown, shape?: ParsedChangeShape): string {
  // Handle null/undefined
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (value === '') return 'empty'

  // Check if this is a pricing field (has 'pricing' as parent)
  const isPricingField = shape && shape.path.includes('pricing')

  // Handle pricing values (numbers or strings)
  if (isPricingField && shape && (typeof value === 'number' || typeof value === 'string')) {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value

    if (!isNaN(numericValue) && shape.key) {
      const pricingField = (pricingFieldMapping[shape.key] as PricingField) || 'input'
      const format = pricingFormats[pricingField]
      const transformedValue = format.transform(numericValue)
      const formattedValue = formatNumber(transformedValue, format.digits)
      return `$${formattedValue}${format.unit}`
    }
  }

  // Handle non-pricing numbers
  if (typeof value === 'number') {
    return value.toLocaleString()
  }

  // Handle strings with truncation
  if (typeof value === 'string') {
    const maxLength = 20
    if (value.length > maxLength) {
      return `${value.slice(0, maxLength)}...`
    }
    return value
  }

  // Handle objects/arrays (basic JSON representation)
  if (typeof value === 'object') {
    const jsonStr = JSON.stringify(value)
    if (jsonStr.length > 30) {
      return `${jsonStr.slice(0, 27)}...`
    }
    return jsonStr
  }

  // Fallback for other types
  return String(value)
}

/**
 * Fallback component for unknown or unsupported change shapes
 */
export function UnknownChange({ shape }: { shape: UnknownShape }) {
  return (
    <div className="space-y-1">
      <div className="text-muted-foreground">{shape.key}</div>
      <div className="text-muted-foreground">Unknown: {shape.reason}</div>
    </div>
  )
}

/**
 * Component to render record changes by stacking individual leaf changes with their keys
 * Each nested change gets rendered using the appropriate leaf renderer
 */
export function RecordChange({ shape }: { shape: ParsedChangeShape }) {
  if (shape.type !== 'record_change') return null

  return (
    <div className="space-y-2">
      {shape.changes.map((change, idx) => (
        <div key={`${shape.key}-${change.key}-${idx}`}>
          {change.shape.type === 'array_change' && <ArrayChange shape={change.shape} />}
          {change.shape.type === 'value_change' && <ValueChange shape={change.shape} />}
          {change.shape.type === 'unknown_shape' && <UnknownChange shape={change.shape} />}
        </div>
      ))}
    </div>
  )
}

/**
 * Main component for rendering change bodies based on their parsed shape
 * Returns rendered JSX for the change details
 */
export function CompactChangeRenderer({ changeBody }: { changeBody: unknown }) {
  const parsed = parseChangeBody(changeBody)

  switch (parsed.type) {
    case 'array_change':
      return <ArrayChange shape={parsed} />

    case 'value_change':
      return <ValueChange shape={parsed} />

    case 'record_change':
      return <RecordChange shape={parsed} />

    case 'unknown_shape':
    default:
      return <UnknownChange shape={parsed} />
  }
}
