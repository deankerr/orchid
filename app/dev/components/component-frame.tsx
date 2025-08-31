import { cn } from '@/lib/utils'

type ComponentFrameProps = {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ComponentFrame({ title, description, children, className }: ComponentFrameProps) {
  return (
    <div className={cn('min-w-48 space-y-3 rounded border border-border p-4', className)}>
      <div className="space-y-1">
        <h3 className="font-mono text-sm font-medium">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      <div className="flex items-center justify-center p-4">{children}</div>
    </div>
  )
}
