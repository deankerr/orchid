import * as R from 'remeda'

import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export function ChangeValuePair({
  before,
  after,
  path_level_1,
  path_level_2,
}: {
  before: unknown
  after: unknown
  path_level_1?: string
  path_level_2?: string
}) {
  // Handle array diffs
  if (Array.isArray(before) && Array.isArray(after)) {
    return <ArrayDiff before={before} after={after} />
  }

  const showPercentage = R.isNumber(before) && R.isNumber(after) && before !== 0
  const percentageChange = showPercentage ? ((after - before) / before) * 100 : 0
  const isIncrease = showPercentage && after > before
  const isGood = path_level_1 === 'pricing' ? !isIncrease : isIncrease

  return (
    <>
      <span className="text-muted-foreground/80"> from </span>
      <ChangeValue value={before} path_level_1={path_level_1} path_level_2={path_level_2} />
      <span className="text-muted-foreground/80"> to </span>
      <ChangeValue value={after} path_level_1={path_level_1} path_level_2={path_level_2} />
      {showPercentage && (
        <>
          {' '}
          <PercentageBadge value={percentageChange} isIncrease={isIncrease} isGood={isGood} />
        </>
      )}
    </>
  )
}

function ChangeValue({
  value,
  path_level_1,
  path_level_2,
}: {
  value: unknown
  path_level_1?: string
  path_level_2?: string
}) {
  if (R.isNumber(value)) {
    const priceKey = path_level_1 === 'pricing' ? path_level_2 : undefined
    return <NumericValue value={value} priceKey={priceKey} />
  }

  if (R.isString(value)) return <StringValue value={value} />
  if (R.isBoolean(value)) return <BooleanValue value={value} />
  if (value === null) return <NullValue />
  if (value === undefined) return <UndefinedValue />

  return <JSONValue value={value} />
}

function NumericValue({ value, priceKey }: { value: number; priceKey?: string }) {
  const formatted = priceKey
    ? formatPrice({
        priceKey,
        priceValue: value,
        unitSuffix: priceKey === 'discount',
      })
    : value.toLocaleString()
  return (
    <Badge className="rounded-md" variant="secondary" title={String(value)}>
      {formatted}
    </Badge>
  )
}

function StringValue({ value }: { value: string }) {
  if (value === '') return <EmptyValue />
  if (value.length >= 60) return <JSONValue value={value} />

  const hasUppercase = value.match(/[A-Z]/)
  const hasSpace = value.match(/\s/)

  return (
    <Badge variant="secondary" className={cn('text-xs', !hasUppercase && !hasSpace && 'font-mono')}>
      {value}
    </Badge>
  )
}

function EmptyValue() {
  return (
    <Badge variant="outline" className="opacity-80">
      empty
    </Badge>
  )
}

function BooleanValue({ value }: { value: boolean }) {
  return <Badge variant="outline">{value ? 'true' : 'false'}</Badge>
}

function NullValue() {
  return <Badge variant="outline">null</Badge>
}

function UndefinedValue() {
  return (
    <Badge variant="outline" className="border-dashed text-muted-foreground/50">
      null {/* intentional */}
    </Badge>
  )
}

function JSONValue({ value }: { value: unknown }) {
  const stringified = JSON.stringify(value, null, 2)
  return (
    <Badge variant="secondary" className="rounded-md">
      {stringified}
    </Badge>
  )
}

function PercentageBadge({
  value,
  isIncrease,
  isGood,
}: {
  value: number
  isIncrease: boolean
  isGood: boolean
}) {
  return (
    <Badge
      className={
        isGood
          ? 'rounded-md border-positive-surface-border bg-positive-surface text-positive-surface-foreground'
          : 'rounded-md border-negative-surface-border bg-negative-surface text-negative-surface-foreground'
      }
    >
      {isIncrease ? <TrendingUpIcon /> : <TrendingDownIcon />}
      {Math.abs(value).toFixed(1)}%
    </Badge>
  )
}

export function ArrayDiff({
  before,
  after,
  showUnchanged,
}: {
  before: unknown[]
  after: unknown[]
  showUnchanged?: boolean
}) {
  const beforeSet = new Set(before.map(String))
  const afterSet = new Set(after.map(String))
  const allItems = Array.from(new Set([...before.map(String), ...after.map(String)])).sort()

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {allItems.map((item) => {
        const inBefore = beforeSet.has(item)
        const inAfter = afterSet.has(item)

        // Unchanged
        if (inBefore && inAfter) {
          if (showUnchanged) {
            return (
              <Badge key={item} variant="outline" className="rounded-md text-muted-foreground">
                {item}
              </Badge>
            )
          } else return null
        }

        // Removed
        if (inBefore) {
          return (
            <Badge
              key={item}
              className="rounded-md border-negative-surface-border bg-negative-surface text-negative-surface-foreground line-through"
            >
              {item}
            </Badge>
          )
        }

        // Added
        return (
          <Badge
            key={item}
            className="rounded-md border-positive-surface-border bg-positive-surface text-positive-surface-foreground"
          >
            + {item}
          </Badge>
        )
      })}
    </span>
  )
}
