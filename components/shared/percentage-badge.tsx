import { cn } from '@/lib/utils'

import { Badge } from '../ui/badge'

export function PercentageBadge({
  value,
  invert,
  className,
  ...props
}: { value: number | null; invert?: boolean } & React.ComponentProps<typeof Badge>) {
  if (value === null || !isFinite(value)) {
    return <span />
  }

  const valueType = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
  const type = invert
    ? valueType === 'positive'
      ? 'negative'
      : valueType === 'negative'
        ? 'positive'
        : 'neutral'
    : valueType

  return (
    <Badge
      className={cn(
        type === 'positive' && 'bg-positive-soft text-positive-soft-foreground',
        type === 'negative' && 'bg-negative-soft text-negative-soft-foreground',
        'gap-0.5 px-1.5',
        className,
      )}
      variant={type === 'neutral' ? 'outline' : 'default'}
      {...props}
    >
      {value > 0 && <span className="-mt-px scale-120">+</span>}
      {value < 0 && <span className="-mt-px scale-120">-</span>}
      {Math.abs(value).toFixed(1)}%
    </Badge>
  )
}
