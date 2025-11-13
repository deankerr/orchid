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
} & React.ComponentProps<'span'>) {
  const { url, style } = getLogo(slug)

  return (
    <span
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-neutral-700/50 bg-muted select-none',
        className,
      )}
      style={{ background: style?.background }}
      {...props}
    >
      {url ? (
        <Image src={url} alt="" width={28} height={28} style={{ scale: style?.scale ?? 0.75 }} />
      ) : (
        <span className="font-mono text-[80%] text-muted-foreground uppercase">
          {(fallbackText || slug).replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)}
        </span>
      )}
    </span>
  )
}
