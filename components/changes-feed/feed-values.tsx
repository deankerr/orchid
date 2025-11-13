import * as R from 'remeda'

import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/formatters'
import { cn } from '@/lib/utils'

// * Array diff styled percentage badge with lucide arrows
export function PercentageBadge({
  value,
  isIncrease,
  isGood,
  className,
  ...props
}: {
  value: number
  isIncrease: boolean
  isGood: boolean
} & React.ComponentProps<typeof Badge>) {
  return (
    <Badge
      className={cn(
        '',
        isGood
          ? 'border-positive-surface-border bg-positive-surface text-positive-surface-foreground'
          : 'border-negative-surface-border bg-negative-surface text-negative-surface-foreground',
        className,
      )}
      {...props}
    >
      {isIncrease ? <TrendingUpIcon /> : <TrendingDownIcon />}
      {Math.abs(value).toFixed(1)}%
    </Badge>
  )
}

// * Inline value change display - always shows before → after
export function InlineValueChange({
  before,
  after,
  path_level_1,
  path_level_2,
  className,
}: {
  before: unknown
  after: unknown
  path_level_1?: string
  path_level_2?: string
  className?: string
}) {
  // Handle array diffs
  if (Array.isArray(before) && Array.isArray(after)) {
    return <InlineArrayDiff before={before} after={after} className={className} />
  }

  const showPercentage = R.isNumber(before) && R.isNumber(after) && before !== 0
  const percentageChange = showPercentage ? ((after - before) / before) * 100 : 0
  const isIncrease = showPercentage && after > before
  const isGood = path_level_1 === 'pricing' ? !isIncrease : isIncrease

  return (
    <span className={cn('', className)}>
      <span className="text-muted-foreground/80"> from </span>
      <InlineValue value={before} path_level_1={path_level_1} path_level_2={path_level_2} />
      <span className="text-muted-foreground/80"> to </span>
      <InlineValue value={after} path_level_1={path_level_1} path_level_2={path_level_2} />
      {showPercentage && (
        <>
          {' '}
          <PercentageBadge
            className="align-middle"
            value={percentageChange}
            isIncrease={isIncrease}
            isGood={isGood}
          />
        </>
      )}
    </span>
  )
}

// * Single inline value display
export function InlineValue({
  value,
  path_level_1,
  path_level_2,
  className,
}: {
  value: unknown
  path_level_1?: string
  path_level_2?: string
  className?: string
}) {
  if (R.isNumber(value)) {
    const priceKey = path_level_1 === 'pricing' ? path_level_2 : undefined
    return <InlineNumericValue value={value} priceKey={priceKey} className={className} />
  }

  if (R.isString(value)) return <InlineStringValue value={value} className={className} />
  if (R.isBoolean(value)) return <InlineBooleanValue value={value} className={className} />
  if (value === null) return <InlineNullValue className={className} />
  if (value === undefined) return <InlineUndefinedValue className={className} />

  return <InlineJSONValue value={value} className={className} />
}

// * Inline numeric value with optional price formatting
function InlineNumericValue({
  value,
  priceKey,
  className,
}: {
  value: number
  priceKey?: string
  className?: string
}) {
  const formatted = priceKey
    ? formatPrice({
        priceKey,
        priceValue: value,
        unitSuffix: priceKey === 'discount',
      })
    : value.toLocaleString()
  return (
    <Badge className={cn('', className)} variant="secondary" title={String(value)}>
      {formatted}
    </Badge>
  )
}

// * Inline string value
function InlineStringValue({ value, className }: { value: string; className?: string }) {
  if (value === '') {
    return (
      <Badge variant="outline" className={cn('opacity-80', className)}>
        empty
      </Badge>
    )
  }
  if (value.length >= 60) return <InlineJSONValue value={value} className={className} />

  const hasUppercase = value.match(/[A-Z]/)
  const hasSpace = value.match(/\s/)

  return (
    <Badge
      variant="secondary"
      className={cn('text-xs', !hasUppercase && !hasSpace && 'font-mono', className)}
    >
      {value}
    </Badge>
  )
}

// * Inline boolean value
function InlineBooleanValue({ value, className }: { value: boolean; className?: string }) {
  return (
    <Badge variant="outline" className={cn('', className)}>
      {value ? 'true' : 'false'}
    </Badge>
  )
}

// * Inline null value
function InlineNullValue({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn('', className)}>
      null
    </Badge>
  )
}

// * Inline undefined value
function InlineUndefinedValue({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn('border-dashed text-muted-foreground/50', className)}>
      null
    </Badge>
  )
}

// * Inline JSON value (for complex/long values)
function InlineJSONValue({ value, className }: { value: unknown; className?: string }) {
  const stringified = JSON.stringify(value, null, 2)

  return (
    <Badge variant="secondary" className={cn('', className)}>
      {stringified}
    </Badge>
  )
}

// * Inline array diff - series of badges showing added/removed/unchanged
export function InlineArrayDiff({
  before,
  after,
  showUnchanged,
  className,
}: {
  before: unknown[]
  after: unknown[]
  showUnchanged?: boolean
  className?: string
}) {
  const beforeSet = new Set(before.map(String))
  const afterSet = new Set(after.map(String))
  const allItems = Array.from(new Set([...before.map(String), ...after.map(String)])).sort()

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {allItems.map((item) => {
        const inBefore = beforeSet.has(item)
        const inAfter = afterSet.has(item)

        // Unchanged
        if (inBefore && inAfter) {
          if (showUnchanged) {
            return (
              <Badge key={item} variant="outline" className="text-muted-foreground">
                <span className="text-[95%]">{item}</span>
              </Badge>
            )
          } else return null
        }

        // Removed
        if (inBefore) {
          return (
            <Badge
              key={item}
              className="border-negative-surface-border bg-negative-surface text-negative-surface-foreground line-through"
            >
              <span className="text-[95%]">{item}</span>
            </Badge>
          )
        }

        // Added
        return (
          <Badge
            key={item}
            className="border-positive-surface-border bg-positive-surface text-positive-surface-foreground"
          >
            + <span className="text-[95%]">{item}</span>
          </Badge>
        )
      })}
    </span>
  )
}
