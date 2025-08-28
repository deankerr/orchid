import React from 'react'
import { ArrowRightIcon, MinusIcon, PlusIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  getChangedFieldNames,
  getChangeShapeSummary,
  parseChangeBody,
  type ParsedChangeShape,
} from '@/lib/change-body-parser'
import { formatNumber, pricingFormats } from '@/lib/formatters'

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
 * Helper function to render a badge with consistent styling and pricing-aware variants
 */
function renderBadge({
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
    <Badge variant={variant} className={`px-1 py-0 font-mono text-xs ${className}`}>
      {icon}
      {children}
    </Badge>
  )
}

/**
 * Helper function to render limited lists with "more" indicators
 */
function renderLimitedList<T>({
  items,
  limit,
  renderItem,
  moreLabel,
  shape,
}: {
  items: T[]
  limit: number
  renderItem: (item: T, index: number) => React.ReactNode
  moreLabel: string
  shape?: ParsedChangeShape
}) {
  return (
    <>
      {items.slice(0, limit).map(renderItem)}
      {items.length > limit &&
        renderBadge({
          children: `+${items.length - limit} ${moreLabel}`,
          shape,
        })}
    </>
  )
}

/**
 * Render array changes showing only the added/removed values
 * Key name and count are handled by the caller context
 */
export function renderArrayChange(shape: ParsedChangeShape) {
  if (shape.type !== 'array_change') return null

  const adds = shape.changes.filter((c) => c.type === 'ADD')
  const removes = shape.changes.filter((c) => c.type === 'REMOVE')
  const totalChanges = adds.length + removes.length

  if (totalChanges === 0) {
    return <div className="font-mono text-xs text-muted-foreground">No changes</div>
  }

  const allChanges = [
    ...adds.map((c) => ({ type: 'ADD' as const, value: c.value })),
    ...removes.map((c) => ({ type: 'REMOVE' as const, value: c.value })),
  ]

  return (
    <div className="flex flex-wrap gap-1">
      {renderLimitedList({
        items: allChanges,
        limit: 4,
        renderItem: (change, idx) => (
          <div key={`${change.type}-${shape.key}-${idx}`}>
            {renderBadge({
              children: change.value,
              icon:
                change.type === 'ADD' ? (
                  <PlusIcon className="mr-1 h-3 w-3 text-success" />
                ) : (
                  <MinusIcon className="mr-1 h-3 w-3 text-destructive" />
                ),
              shape,
            })}
          </div>
        ),
        moreLabel: 'more',
        shape,
      })}
    </div>
  )
}

/**
 * Render record changes by stacking individual leaf changes with their keys
 * Each nested change gets rendered using the appropriate leaf renderer
 */
export function renderRecordChange(shape: ParsedChangeShape) {
  if (shape.type !== 'record_change') return null

  return (
    <div className="grid grid-cols-[100px_1fr] gap-x-2 auto-rows-min">
      {shape.changes.slice(0, 4).map((change, idx) => (
        <React.Fragment key={`${shape.key}-${change.key}-${idx}`}>
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {change.key}:
          </span>
          <div className="min-w-0">
            {change.shape.type === 'array_change' && renderArrayChange(change.shape)}
            {change.shape.type === 'value_change' &&
              renderValueChange(change.shape, { showValues: change.shape.changeType === 'UPDATE' })}
            {change.shape.type === 'unknown_shape' && renderUnknownChange(change.shape)}
          </div>
        </React.Fragment>
      ))}
      {shape.changes.length > 4 && (
        <div className="col-span-2 font-mono text-xs text-muted-foreground">
          +{shape.changes.length - 4} more fields...
        </div>
      )}
    </div>
  )
}

/**
 * Render value changes - typically just show the change type
 * For nested changes, might show old -> new values
 */
export function renderValueChange(shape: ParsedChangeShape, options?: { showValues?: boolean }) {
  if (shape.type !== 'value_change') return null

  const { changeType, key } = shape

  // For ADD/REMOVE actions, show key and value to make it clear the entire key-value pair was added/removed
  if (changeType === 'ADD') {
    return (
      <div className="flex items-center gap-1 font-mono text-xs">
        <PlusIcon className="h-3 w-3 text-success flex-shrink-0" />
        <span className="text-muted-foreground">{key}:</span>
        <span>{formatValue(shape.newValue, shape)}</span>
      </div>
    )
  }

  if (changeType === 'REMOVE') {
    return (
      <div className="flex items-center gap-1 font-mono text-xs">
        <MinusIcon className="h-3 w-3 text-destructive flex-shrink-0" />
        <span className="text-muted-foreground">{key}:</span>
        <span>{formatValue(shape.oldValue, shape)}</span>
      </div>
    )
  }

  // For UPDATE actions, show before/after values or simple text
  if (changeType === 'UPDATE') {
    if (options?.showValues) {
      return renderValueUpdateDetails(shape)
    }

    // Simple text for compact display
    return <div className="font-mono text-xs text-muted-foreground">updated {key}</div>
  }

  // Fallback for other change types - this should not be reached
  return <div className="font-mono text-xs text-muted-foreground">{key} changed</div>
}

/**
 * Render value update details showing before -> after
 * Handles basic string and numeric types
 */
function renderValueUpdateDetails(shape: ParsedChangeShape) {
  if (shape.type !== 'value_change') return null

  const { oldValue, newValue } = shape
  const isPricing = shape.path.includes('pricing')
  const percentageChange = calculatePercentageChange(oldValue, newValue)

  // For pricing changes, use a grid layout to align values
  if (isPricing) {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-1 items-center font-mono text-xs">
        <span className="text-muted-foreground text-right">{formatValue(oldValue, shape)}</span>
        <ArrowRightIcon className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium text-foreground">{formatValue(newValue, shape)}</span>
        <span className={`text-xs font-medium ${
          percentageChange !== null && percentageChange > 0
            ? 'text-green-600 dark:text-green-400'
            : percentageChange !== null && percentageChange < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-muted-foreground'
        }`}>
          {percentageChange !== null && (
            <>
              {percentageChange > 0 ? '+' : ''}
              {percentageChange.toFixed(1)}%
            </>
          )}
        </span>
      </div>
    )
  }

  // Non-pricing changes use the original flexible layout
  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      <span className="text-muted-foreground">{formatValue(oldValue, shape)}</span>
      <ArrowRightIcon className="h-3 w-3 text-muted-foreground" />
      <span className="text-foreground">{formatValue(newValue, shape)}</span>
      {percentageChange !== null && (
        <span
          className={`ml-1 text-xs font-medium ${
            percentageChange > 0
              ? 'text-green-600 dark:text-green-400'
              : percentageChange < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-muted-foreground'
          }`}
        >
          {percentageChange > 0 ? '+' : ''}
          {percentageChange.toFixed(1)}%
        </span>
      )}
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

  // Handle booleans
  if (typeof value === 'boolean') {
    return String(value)
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
 * Calculate percentage change between two numeric values
 * Returns null if either value is not a number or if old value is 0
 * Handles both numbers and strings by parsing strings first
 */
function calculatePercentageChange(oldValue: unknown, newValue: unknown): number | null {
  // Try to parse values as numbers (handles both numbers and strings)
  const oldNum =
    typeof oldValue === 'number'
      ? oldValue
      : typeof oldValue === 'string'
        ? parseFloat(oldValue)
        : NaN
  const newNum =
    typeof newValue === 'number'
      ? newValue
      : typeof newValue === 'string'
        ? parseFloat(newValue)
        : NaN

  // Check if both values are valid numbers
  if (isNaN(oldNum) || isNaN(newNum)) {
    return null
  }

  // Handle edge cases
  if (oldNum === 0) {
    // Can't calculate percentage change from 0, but we can show if new value is positive/negative
    return newNum !== 0 ? (newNum > 0 ? Infinity : -Infinity) : null
  }

  if (oldNum === newNum) {
    return 0
  }

  // Calculate percentage change: ((new - old) / old) * 100
  const change = ((newNum - oldNum) / Math.abs(oldNum)) * 100

  // Cap extremely large percentages for display purposes
  if (Math.abs(change) > 9999) {
    return change > 0 ? 9999 : -9999
  }

  return change
}

/**
 * Fallback renderer for unknown or unsupported change shapes
 */
export function renderUnknownChange(shape: ParsedChangeShape) {
  if (shape.type !== 'unknown_shape') return null

  return <div className="font-mono text-xs text-muted-foreground">Unknown: {shape.reason}</div>
}

/**
 * Generic renderer that uses field names as badges
 * Good fallback for record changes or when specific rendering isn't needed
 */
export function renderGenericFieldChange(shape: ParsedChangeShape) {
  const summary = getChangeShapeSummary(shape)
  const fieldNames = getChangedFieldNames(shape)

  return (
    <div className="space-y-1">
      <div className="font-mono text-xs text-muted-foreground">{summary}</div>
      {fieldNames.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {renderLimitedList({
            items: fieldNames,
            limit: 3,
            renderItem: (key, idx) => (
              <div key={`${key}-${idx}`}>{renderBadge({ children: key, shape })}</div>
            ),
            moreLabel: 'more',
            shape,
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Main dispatcher for rendering change bodies based on their parsed shape
 * Returns rendered JSX for the change details
 */
function renderChangeByShapeInternal(
  changeBody: unknown,
  options: { compact?: boolean } = {},
): React.ReactNode {
  const parsed = parseChangeBody(changeBody)

  switch (parsed.type) {
    case 'array_change':
      return renderArrayChange(parsed)

    case 'value_change':
      // In compact mode, show values for UPDATE actions
      const showValues = options.compact ? parsed.changeType === 'UPDATE' : false
      return renderValueChange(parsed, { showValues })

    case 'record_change':
      return renderRecordChange(parsed)

    case 'unknown_shape':
      return renderUnknownChange(parsed)

    default:
      return renderGenericFieldChange(parsed)
  }
}

/**
 * Main dispatcher for rendering change bodies
 */
export function renderChangeByShape(changeBody: unknown): React.ReactNode {
  return renderChangeByShapeInternal(changeBody)
}

/**
 * Compact dispatcher for use in data grids where space is limited
 */
export function renderCompactChangeByShape(changeBody: unknown): React.ReactNode {
  return renderChangeByShapeInternal(changeBody, { compact: true })
}
