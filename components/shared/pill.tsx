import { cn } from '@/lib/utils'

import { Badge } from '../ui/badge'

export function Pill({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Badge variant="outline" className={cn('rounded-none px-3 py-1', className)}>
      <span className="text-foreground-dim uppercase">{label}</span>
      <span className="mx-1 h-3 w-px bg-border/95 dark:bg-border" />
      <span>{children}</span>
    </Badge>
  )
}
