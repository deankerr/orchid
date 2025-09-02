import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useModelsList, useProvidersList } from '@/hooks/api'
import { cn } from '@/lib/utils'

import { Skeleton } from '../ui/skeleton'

export function EntityCard({
  displayName,
  slug,
  iconUrl,
  className,
}: {
  displayName: string
  slug: string
  iconUrl?: string
  className?: string
}) {
  return (
    <div data-slot="entity-card" className={cn('flex min-w-0 items-center gap-2', className)}>
      <Avatar className="rounded-sm">
        <AvatarImage src={iconUrl} alt={displayName} />
        <AvatarFallback className="font-mono text-sm uppercase">
          {displayName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div data-slot="display-name" className="truncate text-sm">
          {displayName}
        </div>
        <div
          data-slot="slug"
          className="font-mono text-xs text-muted-foreground transition-colors select-all not-hover:truncate hover:z-10 hover:-mx-1 hover:-my-0.5 hover:w-fit hover:bg-background hover:px-1 hover:py-0.5 hover:whitespace-nowrap"
        >
          {slug}
        </div>
      </div>
    </div>
  )
}

export function EntityCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Avatar>
        <Skeleton className="size-full" />
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-30" />
      </div>
    </div>
  )
}

export function ProviderCard({ slug }: { slug: string }) {
  const providers = useProvidersList()
  if (!providers) {
    return <EntityCardSkeleton />
  }

  const [baseSlug] = slug.split('/')
  const provider = providers.find((p) => p.slug === baseSlug)

  const displayName = provider?.name ?? 'Unknown'
  const iconUrl = provider?.icon_url

  return <EntityCard displayName={displayName} slug={slug} iconUrl={iconUrl} />
}

export function ModelCard({ slug }: { slug: string }) {
  const models = useModelsList()
  if (!models) {
    return <EntityCardSkeleton />
  }

  const [baseSlug] = slug.split(':')
  const model = models.find((m) => m.slug === baseSlug)

  const displayName = model?.short_name ?? 'Unknown'
  const iconUrl = model?.icon_url

  return <EntityCard displayName={displayName} slug={slug} iconUrl={iconUrl} />
}
