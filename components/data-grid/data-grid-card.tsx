import { cn } from '@/lib/utils'

import { ScrollArea, ScrollBar } from '../ui/scroll-area'

export function DataGridCard({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'm-0.5 flex flex-1 flex-col overflow-hidden rounded-md border sm:m-1',
        className,
      )}
      {...props}
    />
  )
}

export function DataGridCardToolbar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex shrink-0 items-center gap-2 overflow-x-auto px-2 py-3', className)}
      {...props}
    />
  )
}

export function DataGridCardContent({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="data-grid"
      className={cn('grid flex-1 overflow-hidden border-y', className)}
      {...props}
    >
      <ScrollArea type="auto">
        {children}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

export function DataGridCardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('h-9 shrink-0 px-3 text-sm', className)} {...props} />
}
