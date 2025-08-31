import { cn } from '@/lib/utils'

import { ChangeItemValue, PercentageBadge } from './change-indicators'
import { ChangeKey } from './change-key'

export function NumericValueUpdate({
  keyName,
  fromValue,
  toValue,
  percentageChange,
  parentKeyName,
  className,
  ...props
}: {
  keyName: string
  fromValue: unknown
  toValue: unknown
  percentageChange: number | null
  parentKeyName?: string
} & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid auto-cols-[minmax(72px,auto)] grid-flow-col grid-cols-[144px_minmax(96px,auto)_auto_minmax(96px,auto)] items-center gap-2',
        className,
      )}
      {...props}
    >
      <ChangeKey>{keyName}</ChangeKey>

      <div className="flex items-center justify-center text-neutral-300">
        <ChangeItemValue value={fromValue} keyName={keyName} parentKeyName={parentKeyName} />
      </div>

      <div className="flex items-center justify-center">
        <RightArrow />
      </div>

      <div className="flex items-center justify-center">
        <ChangeItemValue value={toValue} keyName={keyName} parentKeyName={parentKeyName} />
      </div>

      <div className="flex items-center justify-center empty:hidden">
        <PercentageBadge value={percentageChange} />
      </div>
    </div>
  )
}

function RightArrow({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span className={cn('shrink-0 text-muted-foreground', className)} {...props}>
      {'->'}
    </span>
  )
}
