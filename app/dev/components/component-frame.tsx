import { cn } from '@/lib/utils'

type ComponentFrameProps = {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function ComponentFrame({ title, children, className }: ComponentFrameProps) {
  return (
    <div
      className={cn(
        'min-w-60 space-y-3 rounded border border-dashed border-border/50 p-2',
        className,
      )}
    >
      <div className="space-y-1">
        <div className="font-mono text-xs font-medium">{title}</div>
      </div>

      <div className="p-2">{children}</div>
    </div>
  )
}
