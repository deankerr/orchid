import { cn } from '@/lib/utils'

type ComponentSectionProps = {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ComponentSection({
  title,
  description,
  children,
  className,
}: ComponentSectionProps) {
  return (
    <div className="space-y-6 border p-6 not-last:border-b-transparent">
      <div className="space-y-1">
        <div className="text-lg font-semibold">{title}</div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className={cn('flex flex-wrap gap-6', className)}>{children}</div>
    </div>
  )
}
