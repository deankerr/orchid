import Image from 'next/image'

import { getLogo } from '@/lib/logos'
import { cn } from '@/lib/utils'

export function EntityAvatar({
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
        className,
      )}
      style={{ background: style?.background }}
      {...props}
    >
      {url ? (
        <Image
          src={url}
          alt={style?.title || slug}
          width={32}
          height={32}
          style={{ scale: style?.scale ?? 0.75 }}
        />
      ) : (
        <span className="font-mono text-[80%]">
          {(fallbackText || slug).replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)}
        </span>
      )}
    </div>
  )
}
