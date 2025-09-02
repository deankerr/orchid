import { getImageProps } from 'next/image'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useModelsList, useProvidersList } from '@/hooks/api'
import { cn } from '@/lib/utils'

import { Skeleton } from '../ui/skeleton'

export function EntityCard({
  displayName,
  slug,
  iconUrl,
  className,
  ...props
}: {
  displayName: string
  slug: string
  iconUrl?: string
} & React.ComponentProps<'div'>) {
  const { props: imageProps } = getImageProps({
    src: iconUrl ?? '',
    alt: '', // adjacent to entity name
    width: 24,
    height: 24,
  })

  return (
    <div
      data-slot="entity-card"
      className={cn('flex min-w-0 items-center gap-2', className)}
      {...props}
    >
      <Avatar className="size-6 rounded-sm">
        <AvatarImage {...imageProps} />
        <AvatarFallback className="rounded-sm font-mono text-sm uppercase">
          {displayName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div data-slot="display-name" className="truncate text-sm">
          {displayName}
        </div>
        <div
          data-slot="slug"
          className="relative -mx-1 -my-0.5 w-fit max-w-full overflow-hidden rounded-sm px-1 py-0.5 font-mono text-xs text-ellipsis whitespace-nowrap text-muted-foreground outline outline-transparent select-all hover:z-10 hover:max-w-none hover:overflow-visible hover:bg-background hover:outline-border/50 hover:transition-colors"
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
