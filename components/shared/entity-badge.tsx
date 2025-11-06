import { toast } from 'sonner'

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
  const fallbackText = name || slug

  const handleCopySlug = async () => {
    try {
      await navigator.clipboard.writeText(slug)
      toast.success(`Copied to clipboard: ${slug}`)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className={cn('flex overflow-hidden p-0.5', className)} {...props}>
      {/* avatar */}
      <EntityAvatar icon_url={icon_url} fallbackText={fallbackText} />

      {/* text */}
      <div className="grid gap-0.5 overflow-hidden px-2">
        <div className="truncate font-sans text-sm leading-none font-medium">{name}</div>
        <div
          className="-mx-1 cursor-pointer truncate rounded px-1 font-mono text-xs leading-none text-muted-foreground hover:text-primary/90"
          onClick={handleCopySlug}
          title={slug}
        >
          {slug}
        </div>
      </div>
    </div>
  )
}

function EntityBadgeInline({
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
  const fallbackText = name || slug

  const handleCopySlug = async () => {
    try {
      await navigator.clipboard.writeText(slug)
      toast.success(`Copied to clipboard: ${slug}`)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className={cn('flex items-center gap-1.5 px-0.5 text-sm', className)} {...props}>
      <EntityAvatar icon_url={icon_url} fallbackText={fallbackText} className="w-3.5" />
      <div
        className="-mx-1 cursor-pointer rounded px-1 font-mono text-[95%] leading-none text-foreground/85"
        onClick={handleCopySlug}
      >
        {slug}
      </div>
    </div>
  )
}

export function ProviderBadge({
  slug,
  inline,
  ...props
}: { slug: string; inline?: boolean } & React.ComponentProps<'div'>) {
  const [baseSlug] = slug.split('/')

  const providersList = useCachedQuery(api.db.or.views.providers.list, {})
  const provider = providersList?.find((p) => p.slug === baseSlug)

  if (inline) {
    return (
      <EntityBadgeInline
        name={provider?.name ?? ''}
        slug={slug}
        icon_url={provider?.icon_url ?? ''}
        {...props}
      />
    )
  }

  return (
    <EntityBadge
      name={provider?.name ?? ''}
      slug={slug}
      icon_url={provider?.icon_url ?? ''}
      {...props}
    />
  )
}

export function ModelBadge({
  slug,
  inline = false,
  ...props
}: { slug: string; inline?: boolean } & React.ComponentProps<'div'>) {
  const modelsList = useCachedQuery(api.db.or.views.models.list, {})
  const model = modelsList?.find((m) => m.slug === slug)

  if (inline) {
    return (
      <EntityBadgeInline
        name={model?.name ?? ''}
        slug={slug}
        icon_url={model?.icon_url ?? ''}
        {...props}
      />
    )
  }

  return (
    <EntityBadge name={model?.name ?? ''} slug={slug} icon_url={model?.icon_url ?? ''} {...props} />
  )
}
