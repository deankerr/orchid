import { memo } from 'react'

import { api } from '@/convex/_generated/api'

import { useCachedQuery } from '@/hooks/use-cached-query'
import { cn } from '@/lib/utils'

import { EntityAvatar } from './entity-avatar'

export const EntityCard = memo(
  ({
    icon_url,
    name,
    slug,
    className,
    hoverSlugReveal = true,
    ...props
  }: {
    icon_url: string
    name: string
    slug: string
    hoverSlugReveal?: boolean
  } & React.ComponentProps<'div'>) => {
    const fallback = name || slug

    return (
      <div className={cn('flex min-w-0 items-center gap-2 p-0.5 text-left', className)} {...props}>
        <EntityAvatar src={icon_url} fallback={fallback} className="size-6" />
        <div className="min-w-0 flex-1">
          <div className={cn('truncate font-sans text-sm leading-tight font-medium')}>{name}</div>
          <div
            className={cn(
              'relative -mx-1 w-fit max-w-full overflow-hidden rounded-sm px-1 font-mono text-xs leading-none text-ellipsis whitespace-nowrap text-muted-foreground outline outline-transparent select-all',
              hoverSlugReveal &&
                'hover:z-10 hover:max-w-none hover:overflow-visible hover:bg-background hover:outline-border/50 hover:transition-colors',
            )}
          >
            {slug}
          </div>
        </div>
      </div>
    )
  },
)
EntityCard.displayName = 'EntityCard'

export function ProviderCard({ slug }: { slug: string }) {
  const [baseSlug] = slug.split('/')

  const providersList = useCachedQuery(api.db.or.views.providers.list, {})
  const provider = providersList?.find((p) => p.slug === baseSlug)

  return (
    <EntityCard
      name={provider?.name ?? ''}
      slug={provider?.slug ?? (slug || 'unknown')}
      icon_url={provider?.icon_url ?? ''}
    />
  )
}

export function ModelCard({ slug }: { slug: string }) {
  const modelsList = useCachedQuery(api.db.or.views.models.list, {})
  const model = modelsList?.find((m) => m.slug === slug)

  return (
    <EntityCard
      name={model?.name ?? ''}
      slug={model?.slug ?? (slug || 'unknown')}
      icon_url={model?.icon_url ?? ''}
    />
  )
}
