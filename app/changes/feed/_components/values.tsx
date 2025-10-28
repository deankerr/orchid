import * as R from 'remeda'

import type { Doc } from '@/convex/_generated/dataModel'

import { PercentageBadge } from '@/components/shared/percentage-badge'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export function ChangePair({ change }: { change: Doc<'or_views_changes'> }) {
  const { before, after, path_level_1, path_level_2 } = change

  // Handle array diffs
  if (Array.isArray(before) && Array.isArray(after)) {
    return <ArrayDiff before={before} after={after} />
  }

  const showPercentage = R.isNumber(before) && R.isNumber(after) && before !== 0

  const percentageChange = showPercentage ? ((after - before) / before) * 100 : null

  const shouldInvert = path_level_1 === 'pricing'

  return (
    <div className="flex flex-wrap items-center gap-3 *:data-[slot=badge]:min-w-24 *:data-[slot=badge]:py-1 *:data-[slot=badge]:text-sm">
      <ChangeValue value={before} path_level_1={path_level_1} path_level_2={path_level_2} />
      <span className="shrink-0 text-base text-muted-foreground">{'-->'}</span>
      <ChangeValue value={after} path_level_1={path_level_1} path_level_2={path_level_2} />
      {showPercentage && (
        <div>
          <PercentageBadge
            className="py-1 text-sm"
            value={percentageChange}
            invert={shouldInvert}
          />
        </div>
      )}
    </div>
  )
}

function ChangeValue({
  value,
  path_level_1 = '',
  path_level_2 = '',
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
    <Badge className="font-mono" variant="secondary" title={String(value)}>
      {formatted}
    </Badge>
  )
}

function StringValue({ value }: { value: string }) {
  if (value === '') return <EmptyStringValue />
  if (value.length >= 60) return <JSONValue value={value} />

  const hasUppercase = value.match(/[A-Z]/)
  const hasSpace = value.match(/\s/)

  return (
    <Badge variant="secondary" className={cn(!hasUppercase && !hasSpace && 'font-mono')}>
      {value}
    </Badge>
  )
}

function EmptyStringValue() {
  return <MonoBadge className="opacity-50">empty</MonoBadge>
}

function BooleanValue({ value }: { value: boolean }) {
  return <MonoBadge>{value ? 'true' : 'false'}</MonoBadge>
}

function NullValue() {
  return <MonoBadge>null</MonoBadge>
}

function UndefinedValue() {
  return <MonoBadge className="border-dashed">undefined</MonoBadge>
}

function JSONValue({ value }: { value: unknown }) {
  const stringified = JSON.stringify(value, null, 2)
  return (
    <pre className="max-h-40 max-w-1/2 overflow-auto rounded bg-muted/40 p-2 text-xs">
      {stringified}
    </pre>
  )
}

export function MonoBadge({ children, className, ...props }: React.ComponentProps<typeof Badge>) {
  return (
    <Badge variant="outline" className={cn('text-muted-foreground', className)} {...props}>
      <span className="font-mono text-[90%]">{children}</span>
    </Badge>
  )
}

export function ArrayDiff({ before, after }: { before: unknown[]; after: unknown[] }) {
  const beforeSet = new Set(before.map(String))
  const afterSet = new Set(after.map(String))
  const allItems = Array.from(new Set([...before.map(String), ...after.map(String)])).sort()

  return (
    <div className="flex flex-wrap gap-1.5 font-mono">
      {allItems.map((item) => {
        const inBefore = beforeSet.has(item)
        const inAfter = afterSet.has(item)

        // Unchanged
        if (inBefore && inAfter) {
          return (
            <Badge key={item} variant="outline" className="text-muted-foreground">
              {item}
            </Badge>
          )
        }

        // Removed
        if (inBefore) {
          return (
            <Badge
              key={item}
              className="border-negative-surface-border bg-negative-surface text-negative-surface-foreground line-through"
            >
              {item}
            </Badge>
          )
        }

        // Added
        return (
          <Badge
            key={item}
            className="border-positive-surface-border bg-positive-surface text-positive-surface-foreground"
          >
            + {item}
          </Badge>
        )
      })}
    </div>
  )
}
