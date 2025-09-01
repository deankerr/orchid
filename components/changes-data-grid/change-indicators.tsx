import { ArrowDownIcon, ArrowRightIcon, MoveRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Badge } from '../ui/badge'

export function RightArrow({ className, ...props }: React.ComponentProps<typeof ArrowRightIcon>) {
  return <MoveRightIcon className={cn('size-6 text-muted-foreground/80', className)} {...props} />
}

export function DownArrow({ className, ...props }: React.ComponentProps<typeof ArrowDownIcon>) {
  return <ArrowDownIcon className={cn('size-4 text-muted-foreground', className)} {...props} />
}

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
        'border-positive-surface-border bg-positive-surface text-positive-surface-foreground',
        className,
      )}
      {...props}
    >
      CREATED
    </Badge>
  )
}

export function DeleteBadge({ className, ...props }: React.ComponentProps<typeof Badge>) {
  return (
    <Badge
      className={cn(
        'border-negative-surface-border bg-negative-surface text-negative-surface-foreground',
        className,
      )}
      {...props}
    >
      DELETED
    </Badge>
  )
}

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
