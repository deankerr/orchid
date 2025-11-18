import { cn } from '@/lib/utils'

import { EntityAvatar } from '../shared/entity-avatar'

export function EntitySheetHeader({
  type,
  slug,
  name,
  onSlugClick,
  className,
  ...props
}: {
  type: 'model' | 'provider'
  slug: string
  name: string
  onSlugClick?: () => void
} & React.ComponentProps<'div'>) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      <div className="font-mono text-xs text-muted-foreground uppercase">{type}</div>
      <div className="flex gap-3">
        <EntityAvatar slug={slug} className="size-10" />
        <div className="flex flex-col">
          <div className="font-sans text-lg leading-tight font-semibold">{name}</div>
          <div
            onClick={onSlugClick}
            className="cursor-pointer font-mono text-sm text-muted-foreground hover:text-primary/90"
            title="Click to copy"
          >
            {slug}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EntitySheetSection({
  title,
  children,
  className,
  ...props
}: {
  title: string
  children: React.ReactNode
} & React.ComponentProps<'div'>) {
  return (
    <div className={cn('space-y-3 px-4', className)} {...props}>
      <h3 className="font-mono text-xs text-muted-foreground uppercase">{title}</h3>
      {children}
    </div>
  )
}

EntitySheetHeader.displayName = 'EntitySheetHeader'
EntitySheetSection.displayName = 'EntitySheetSection'
