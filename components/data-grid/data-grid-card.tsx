import { cn } from '@/lib/utils'

import { ScrollArea } from '../ui/scroll-area'

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

export function DataGridCardToolbar({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollArea>) {
  return (
    <ScrollArea className="shrink-0" maskHeight={10} orientation="horizontal" {...props}>
      <div className={cn('flex items-center gap-2 px-2 py-3', className)}>{children}</div>
    </ScrollArea>
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
      className={cn('flex flex-1 overflow-hidden border-y', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function DataGridCardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex h-9 shrink-0 items-center justify-center px-3 font-mono text-xs text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}
