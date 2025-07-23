import { cn } from '@/lib/utils'

interface LoadingProps {
  className?: string
}

export function DataStreamLoader({
  className,
  label = 'Loading',
}: LoadingProps & { label?: string }) {
  return (
    <div className={cn('font-mono text-sm text-muted-foreground', className)}>
      <div className="flex items-center space-x-2">
        <div className="flex space-x-0.5">
          <div className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:0ms]" />
          <div className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
          <div className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
        </div>
        <span>{label}</span>
      </div>
    </div>
  )
}

export function ErrorState({
  message = 'Something went wrong',
  details,
  className,
}: {
  message?: string
  details?: string
  className?: string
}) {
  return (
    <div className={cn('font-mono text-sm', className)}>
      <div className="rounded-none border border-destructive bg-card p-4">
        <div className="flex items-start space-x-2">
          <span className="text-destructive">[ERROR]</span>
          <div className="space-y-1">
            <div className="text-destructive">{message}</div>
            {details && <div className="text-xs text-muted-foreground">{details}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EmptyState({
  message = 'No data available',
  icon = '∅',
  className,
}: {
  message?: string
  icon?: string
  className?: string
}) {
  return (
    <div className={cn('py-8 text-center font-mono text-sm text-muted-foreground', className)}>
      <div className="space-y-2">
        <div className="text-2xl">{icon}</div>
        <div>{message}</div>
      </div>
    </div>
  )
}
