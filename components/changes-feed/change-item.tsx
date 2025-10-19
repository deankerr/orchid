import type { EndpointChange } from '@/convex/feed'

import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/formatters'

export function ChangeItem({ change }: { change: EndpointChange }) {
  const { change_kind, model_slug, path, before, after } = change

  return (
    <div className="flex items-start gap-3 font-mono text-xs">
      <div className="flex-shrink-0">
        <StatusBadge kind={change_kind} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Badge variant="outline" className="border-transparent px-0">
          {model_slug}
        </Badge>

        <div className="empty:hidden">{path}</div>

        {Array.isArray(before) && Array.isArray(after) ? (
          <ArrayDiff before={before} after={after} />
        ) : change.change_kind === 'update' ? (
          <UpdateValue change={change} />
        ) : null}
      </div>
    </div>
  )
}

function StatusBadge({ kind }: { kind: 'create' | 'delete' | 'update' }) {
  if (kind === 'create') {
    return (
      <Badge className="border-positive-surface-border bg-positive-surface text-positive-surface-foreground">
        CREATED
      </Badge>
    )
  }

  if (kind === 'delete') {
    return (
      <Badge className="border-negative-surface-border bg-negative-surface text-negative-surface-foreground">
        DELETED
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-transparent text-muted-foreground">
      CHANGED
    </Badge>
  )
}

function ArrayDiff(args: { before: unknown[]; after: unknown[] }) {
  const { before, after } = args

  const beforeSet = new Set(before.map(String))
  const afterSet = new Set(after.map(String))
  const allItems = Array.from(new Set([...before.map(String), ...after.map(String)]))

  return (
    <div className="flex flex-wrap gap-1.5">
      {allItems.map((item) => {
        const inBefore = beforeSet.has(item)
        const inAfter = afterSet.has(item)

        // Unchanged
        if (inBefore && inAfter) {
          return (
            <Badge key={item} variant="outline" className="text-xs">
              {item}
            </Badge>
          )
        }

        // Removed
        if (inBefore) {
          return (
            <Badge
              key={item}
              className="border-negative-surface-border bg-negative-surface text-xs text-negative-surface-foreground line-through"
            >
              {item}
            </Badge>
          )
        }

        // Added
        return (
          <Badge
            key={item}
            className="border-positive-surface-border bg-positive-surface text-xs text-positive-surface-foreground"
          >
            + {item}
          </Badge>
        )
      })}
    </div>
  )
}

function UpdateValue({ change }: { change: EndpointChange }) {
  // Non-arrays show before → after
  return (
    <div className="flex items-center gap-2">
      <Value value={change.before} change={change} />
      <span className="flex-shrink-0 text-muted-foreground">→</span>
      <Value value={change.after} change={change} />
    </div>
  )
}

function Value(args: { value: unknown; change?: EndpointChange }) {
  const { value, change } = args

  if (value === undefined) {
    return (
      <Badge variant="outline" className="border-dashed text-muted-foreground">
        undefined
      </Badge>
    )
  }

  if (value === null) {
    return <span className="text-muted-foreground">null</span>
  }

  if (typeof value === 'boolean') {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {value ? 'true' : 'false'}
      </Badge>
    )
  }

  if (typeof value === 'string') {
    if (value === '') {
      return (
        <Badge variant="outline" className="text-muted-foreground opacity-50">
          empty
        </Badge>
      )
    }
    return <span className="block break-words">{value}</span>
  }

  if (typeof value === 'number') {
    const formatted = formatPriceValue(value, change)
    if (formatted) {
      return <span title={String(value)}>{formatted}</span>
    }
    return <span>{value.toLocaleString()}</span>
  }

  // Objects/arrays show scrollable JSON
  const stringified = JSON.stringify(value, null, 2)
  return <pre className="max-h-40 overflow-auto rounded bg-muted/40 p-2 text-xs">{stringified}</pre>
}

function formatPriceValue(value: number, change?: EndpointChange) {
  if (!change || change.path_level_1 !== 'pricing') return null

  const priceKey = change.path_level_2 ?? change.path?.split('.').pop()
  if (!priceKey) return null

  try {
    return formatPrice({ priceKey, priceValue: value })
  } catch {
    return null
  }
}
