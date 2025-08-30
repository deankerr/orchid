import { useModelsList, useProvidersList } from '@/hooks/api'
import { cn } from '@/lib/utils'

import { BrandIcon } from '../shared/brand-icon'

function EntityFallbackAvatar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex size-6 items-center justify-center rounded-sm bg-muted/60 font-mono text-xs',
        className,
      )}
    >
      {typeof children === 'string' ? children.slice(0, 2).toUpperCase() : children}
    </div>
  )
}

export function ProviderNameCell({ id }: { id: string }) {
  const providers = useProvidersList()
  if (!providers) return null

  const [slug] = id.split('/') // don't display this one
  const provider = providers.find((p) => p.slug === slug)

  const displayName = provider?.name ?? 'Unknown'
  const displayId = id
  const iconUrl = provider?.icon_url

  return (
    <div className="flex min-w-0 items-center gap-2">
      {iconUrl ? (
        <div className="flex size-6 items-center justify-center rounded-sm">
          <BrandIcon url={iconUrl} />
        </div>
      ) : (
        <EntityFallbackAvatar>{displayName}</EntityFallbackAvatar>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{displayName}</div>
        <div className="truncate font-mono text-xs text-muted-foreground">{displayId}</div>
      </div>
    </div>
  )
}

export function ModelNameCell({ id }: { id: string }) {
  const models = useModelsList()
  if (!models) return null

  const [slug] = id.split(':')
  const model = models.find((m) => m.slug === slug)

  const displayName = model?.short_name ?? 'Unknown'
  const displayId = id
  const iconUrl = model?.icon_url

  return (
    <div className="flex min-w-0 items-center gap-2">
      {iconUrl ? (
        <div className="flex size-6 items-center justify-center rounded-sm">
          <BrandIcon url={iconUrl} />
        </div>
      ) : (
        <EntityFallbackAvatar>{displayName}</EntityFallbackAvatar>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{displayName}</div>
        {id && <div className="truncate font-mono text-xs text-muted-foreground">{displayId}</div>}
      </div>
    </div>
  )
}
