import { api } from '@/convex/_generated/api'

import { useEntitySheet } from '@/components/entity-sheet/use-entity-sheet'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { cn } from '@/lib/utils'

import { EntityAvatar } from './entity-avatar'

export function EntityBadge({
  name,
  slug,
  className,
  onBadgeClick,
  ...props
}: {
  name: string
  slug: string
  onBadgeClick?: () => void
} & React.ComponentProps<'div'>) {
  const fallbackText = name || slug

  const handleClick = () => {
    if (onBadgeClick) {
      onBadgeClick()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onBadgeClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onBadgeClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onBadgeClick ? 'button' : undefined}
      tabIndex={onBadgeClick ? 0 : undefined}
      className={cn(
        'flex overflow-hidden p-0.5 text-left',
        onBadgeClick && 'cursor-pointer hover:opacity-80',
        className,
      )}
      {...props}
    >
      <EntityAvatar slug={slug} fallbackText={fallbackText} />
      <div className="grid gap-0.5 overflow-hidden px-2">
        <div className="truncate font-sans text-sm leading-none font-medium">{name}</div>
        <div className="truncate font-mono text-xs leading-none text-muted-foreground">{slug}</div>
      </div>
    </div>
  )
}

export function ProviderBadge({ slug, ...props }: { slug: string } & React.ComponentProps<'div'>) {
  const [baseSlug] = slug.split('/')
  const { openProvider } = useEntitySheet()

  const providersList = useCachedQuery(api.providers.list, {})
  const provider = providersList?.find((p) => p.slug === baseSlug)

  return (
    <EntityBadge
      name={provider?.name ?? ''}
      slug={slug}
      onBadgeClick={() => openProvider(baseSlug)}
      {...props}
    />
  )
}

export function ModelBadge({ slug, ...props }: { slug: string } & React.ComponentProps<'div'>) {
  const { openModel } = useEntitySheet()

  const modelsList = useCachedQuery(api.models.list, {})
  const model = modelsList?.find((m) => m.slug === slug)

  return (
    <EntityBadge
      name={model?.name ?? ''}
      slug={slug}
      onBadgeClick={() => openModel(slug)}
      {...props}
    />
  )
}
