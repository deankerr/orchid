import Image from 'next/image'

import { getLogo } from '@/lib/logos'
import { cn } from '@/lib/utils'

export function BrandAvatar({
  slug,
  fallbackText,
  className,
  ...props
}: {
  slug: string
  fallbackText?: string
} & React.ComponentProps<'div'>) {
  const { url, style } = getLogo(slug)

  return (
    <div
      className={cn(
        'flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted',
        'font-mono text-[90%]',
        className,
      )}
      style={style?.background ? { background: style.background } : undefined}
      {...props}
    >
      {url ? (
        <Image
          src={url}
          alt={style?.title || slug}
          width={32}
          height={32}
          unoptimized
          style={{ scale: style?.scale ?? 0.75 }}
        />
      ) : (
        (fallbackText || slug).replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)
      )}
    </div>
  )
}
