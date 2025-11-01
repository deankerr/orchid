import { api } from '@/convex/_generated/api'

import { EntityAvatar } from '@/components/shared/entity-avatar'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { cn } from '@/lib/utils'

// * Base entity display - inline badge style
export function EntityInline({
  icon_url,
  name,
  slug,
  showName = true,
  showSlug = false,
  className,
  ...props
}: {
  icon_url: string
  name: string
  slug: string
  showName?: boolean
  showSlug?: boolean
  className?: string
} & React.ComponentProps<'span'>) {
  const fallback = name || slug
  const display = name || slug

  return (
    <span className={cn('inline-flex items-center gap-1.5 align-middle', className)} {...props}>
      <EntityAvatar src={icon_url} fallback={fallback} className="h-[0.8lh]" />
      {showName && <span className="font-medium">{display}</span>}
      {showSlug && <span className="font-mono text-[95%] text-neutral-300">{slug}</span>}
    </span>
  )
}

// * Provider variants
export function ProviderInline({
  slug,
  showName,
  showSlug,
}: {
  slug: string
  showName?: boolean
  showSlug?: boolean
}) {
  const [baseSlug] = slug.split('/')
  const providersList = useCachedQuery(api.db.or.views.providers.list, {})
  const provider = providersList?.find((p) => p.slug === baseSlug)

  return (
    <EntityInline
      icon_url={provider?.icon_url ?? ''}
      name={provider?.name ?? ''}
      slug={slug}
      showName={showName}
      showSlug={showSlug}
    />
  )
}

// * Model variants
export function ModelInline({ slug, showSlug = false }: { slug: string; showSlug?: boolean }) {
  const modelsList = useCachedQuery(api.db.or.views.models.list, {})
  const model = modelsList?.find((m) => m.slug === slug)

  return (
    <EntityInline
      icon_url={model?.icon_url ?? ''}
      name={model?.name ?? ''}
      slug={slug}
      showSlug={showSlug}
    />
  )
}
