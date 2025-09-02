import { useModelsList, useProvidersList } from '@/hooks/api'
import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

export function ProviderNameCell({ id }: { id: string }) {
  const providers = useProvidersList()
  if (!providers) return null

  const [slug] = id.split('/')
  const provider = providers.find((p) => p.slug === slug)

  const displayName = provider?.name ?? 'Unknown'
  const iconUrl = provider?.icon_url

  return <EntityCell displayName={displayName} displayId={id} iconUrl={iconUrl} />
}

export function ModelNameCell({ id }: { id: string }) {
  const models = useModelsList()
  if (!models) return null

  const [slug] = id.split(':')
  const model = models.find((m) => m.slug === slug)

  const displayName = model?.short_name ?? 'Unknown'
  const iconUrl = model?.icon_url

  return <EntityCell displayName={displayName} displayId={id} iconUrl={iconUrl} />
}

export function EntityCell({
  displayName,
  displayId,
  iconUrl,
  className,
}: {
  displayName: string
  displayId?: string
  iconUrl?: string
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Avatar className="size-6 rounded-sm">
        {iconUrl && <AvatarImage src={iconUrl} alt={displayName} />}
        <AvatarFallback className="rounded-sm bg-muted/60 font-mono text-xs">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{displayName}</div>
        {displayId && (
          <div className="truncate font-mono text-xs text-muted-foreground">{displayId}</div>
        )}
      </div>
    </div>
  )
}
