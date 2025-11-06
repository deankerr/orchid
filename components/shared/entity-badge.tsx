import Image from 'next/image'

import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'

import { useCachedQuery } from '@/hooks/use-cached-query'
import { cn } from '@/lib/utils'

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
      <div className="flex shrink-0 items-center">
        {icon_url ? (
          <Image
            src={icon_url}
            alt=""
            width={32}
            height={32}
            unoptimized
            className="aspect-square w-6"
          />
        ) : (
          <div className="grid aspect-square w-6 place-content-center rounded-sm bg-muted font-mono text-[90%]">
            {fallback.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)}
          </div>
        )}
      </div>

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

export function ProviderBadge({ slug, ...props }: { slug: string } & React.ComponentProps<'div'>) {
  const [baseSlug] = slug.split('/')

  const providersList = useCachedQuery(api.db.or.views.providers.list, {})
  const provider = providersList?.find((p) => p.slug === baseSlug)

  return (
    <EntityBadge
      name={provider?.name ?? ''}
      slug={provider?.slug ?? (slug || 'unknown')}
      icon_url={provider?.icon_url ?? ''}
      {...props}
    />
  )
}

export function ModelBadge({ slug, ...props }: { slug: string } & React.ComponentProps<'div'>) {
  const modelsList = useCachedQuery(api.db.or.views.models.list, {})
  const model = modelsList?.find((m) => m.slug === slug)

  return (
    <EntityBadge
      name={model?.name ?? ''}
      slug={model?.slug ?? (slug || 'unknown')}
      icon_url={model?.icon_url ?? ''}
      {...props}
    />
  )
}
