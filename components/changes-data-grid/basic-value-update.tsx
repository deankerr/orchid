import { cn } from '@/lib/utils'

import { ChangeItemValue } from './change-indicators'
import { ChangeKey } from './change-key'

export function BasicValueUpdate({
  keyName,
  fromValue,
  toValue,
  parentKeyName,
  className,
  ...props
}: {
  keyName: string
  fromValue: unknown
  toValue: unknown
  parentKeyName?: string
} & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('grid grid-cols-[144px_1fr_auto_1fr] items-center gap-2', className)}
      {...props}
    >
      <ChangeKey>{keyName}</ChangeKey>

      <div className="flex items-center justify-center text-right text-neutral-300">
        <ChangeItemValue value={fromValue} keyName={keyName} parentKeyName={parentKeyName} />
      </div>

      <div className="flex items-center justify-center text-center">
        <RightArrow />
      </div>

      <div className="flex items-center justify-center text-left">
        <ChangeItemValue value={toValue} keyName={keyName} parentKeyName={parentKeyName} />
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
