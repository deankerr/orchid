import { cn } from '@/lib/utils'

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
