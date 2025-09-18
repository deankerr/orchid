import { cn } from '@/lib/utils'

export function DataGridFrame({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'm-0.5 flex flex-1 flex-col overflow-hidden rounded-md border sm:m-1',
        className,
      )}
    />
  )
}

export function DataGridFrameToolbar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn('flex items-center gap-2 overflow-x-auto px-2 py-3', className)}
    />
  )
}

export function DataGridFrameFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'grid h-9 grid-cols-3 items-center justify-items-center px-3 text-sm text-muted-foreground',
        className,
      )}
    />
  )
}
