import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { EntityAvatar } from './entity-avatar'

export function EntityBadge({
  name,
  slug,
  size = 'sm',
  className,
  ...props
}: {
  name: string
  slug: string
  size?: 'sm' | 'lg'
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

  const sizeClasses = {
    sm: {
      avatar: 'size-7',
      name: 'font-sans text-sm leading-none font-medium',
      slug: 'font-mono text-xs',
    },
    lg: {
      avatar: 'size-10 mr-1',
      name: 'font-sans text-lg leading-tight font-semibold',
      slug: 'font-mono text-sm',
    },
  }

  const sizeConfig = sizeClasses[size]

  return (
    <div className={cn('flex gap-2 overflow-hidden p-0.5 text-left', className)} {...props}>
      <EntityAvatar slug={slug} fallbackText={fallbackText} className={sizeConfig.avatar} />
      <div className="flex flex-col overflow-hidden">
        <div className={cn('truncate', sizeConfig.name)}>{name}</div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleCopySlug()
          }}
          className={cn(
            'cursor-pointer truncate text-left text-muted-foreground hover:text-primary/90',
            sizeConfig.slug,
          )}
          title="Click to copy"
        >
          {slug}
        </button>
      </div>
    </div>
  )
}

export function EntityInline({
  slug,
  fallbackText,
  className,
  ...props
}: {
  slug: string
  fallbackText?: string
} & React.ComponentProps<'span'>) {
  return (
    <span className={cn('gap-1.5 font-mono text-muted-foreground', className)} {...props}>
      <EntityAvatar
        slug={slug}
        fallbackText={fallbackText}
        className="mr-1 size-4.5 align-text-bottom"
      />
      {slug}
    </span>
  )
}
