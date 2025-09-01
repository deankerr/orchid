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
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className={cn('flex-warp flex grid-cols-4 gap-3 md:grid md:gap-6', className)}>
        {children}
      </div>
    </div>
  )
}
