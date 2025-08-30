import { ArrowDownIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { ChangeItemValue } from './change-indicators'
import { ChangeKey } from './change-key'

export function BlockValueUpdate({
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
    <div className={cn('grid gap-2', className)} {...props}>
      <ChangeKey>{keyName}</ChangeKey>

      <BlockValue>
        <ChangeItemValue value={fromValue} keyName={keyName} parentKeyName={parentKeyName} />
      </BlockValue>

      <div className="flex items-center justify-center text-center">
        <ArrowDownIcon className="size-4 text-muted-foreground" />
      </div>

      <BlockValue>
        <ChangeItemValue value={toValue} keyName={keyName} parentKeyName={parentKeyName} />
      </BlockValue>
    </div>
  )
}

function BlockValue(props: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-sm border border-border/30 bg-card/30 p-1 text-center font-sans text-card-foreground has-data-[slot=badge]:border-transparent has-data-[slot=badge]:bg-transparent',
        props.className,
      )}
      {...props}
    />
  )
}
