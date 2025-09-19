import { cn } from '@/lib/utils'

import { useEndpoints } from './provider'

export function EndpointsFrame({ className, ...props }: React.ComponentProps<'div'>) {
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

export function EndpointsToolbar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center gap-2 overflow-x-auto px-2 py-3', className)}
      {...props}
    />
  )
}

export function EndpointsFooter({ className, ...props }: React.ComponentProps<'div'>) {
  const { recordCount, isLoading } = useEndpoints()

  return (
    <div
      className={cn(
        'grid h-9 grid-cols-3 items-center justify-items-center px-3 text-sm text-muted-foreground',
        className,
      )}
      {...props}
    >
      <div className="justify-self-start">{props.children}</div>

      <div className="">{isLoading && <div className="text-xs">Loading...</div>}</div>

      <div className="justify-self-end font-mono text-xs">{recordCount} items loaded</div>
    </div>
  )
}
