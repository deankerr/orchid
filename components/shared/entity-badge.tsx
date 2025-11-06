import { api } from '@/convex/_generated/api'

import { useCachedQuery } from '@/hooks/use-cached-query'
import { cn } from '@/lib/utils'

import { EntityAvatar } from './entity-avatar'

export function EntityBadge({
  icon_url,
  name,
  slug,
  className,
  ...props
}: {
  icon_url: string
  name: string
  slug: string
} & React.ComponentProps<'div'>) {
  const fallback = name || slug

  return (
    <div className={cn('flex items-center gap-2 overflow-hidden', className)} {...props}>
      <EntityAvatar src={icon_url} fallback={fallback} className="size-6" />
      <div className="">
        <div className="font-sans leading-tight font-medium">{name}</div>
        <div className="font-mono text-[85%] leading-none whitespace-nowrap text-muted-foreground">
          {slug}
        </div>
      </div>
    </div>
  )
}

export function ProviderBadge({ slug }: { slug: string }) {
  const [baseSlug] = slug.split('/')

  const providersList = useCachedQuery(api.db.or.views.providers.list, {})
  const provider = providersList?.find((p) => p.slug === baseSlug)

  return (
    <EntityBadge
      name={provider?.name ?? ''}
      slug={provider?.slug ?? (slug || 'unknown')}
      icon_url={provider?.icon_url ?? ''}
    />
  )
}

export function ModelBadge({ slug }: { slug: string }) {
  const modelsList = useCachedQuery(api.db.or.views.models.list, {})
  const model = modelsList?.find((m) => m.slug === slug)

  return (
    <EntityBadge
      name={model?.name ?? ''}
      slug={model?.slug ?? (slug || 'unknown')}
      icon_url={model?.icon_url ?? ''}
    />
  )
}
