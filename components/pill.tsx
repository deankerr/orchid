import { cn } from '@/lib/utils'

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
    <div
      className={cn('flex w-fit rounded border border-border/80 text-xs font-medium', className)}
    >
      <div className="bg-secondary px-2 py-1 text-secondary-foreground">{label}</div>
      <div className="px-2 py-1">{children}</div>
    </div>
  )
}
