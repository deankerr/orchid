/* eslint-disable @next/next/no-img-element */
import { cn } from '@/lib/utils'

export function EntityAvatar({
  src,
  fallback,
  className,
  ...props
}: {
  src: string | null | undefined
  fallback: string
} & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid aspect-square shrink-0 place-content-stretch rounded-sm font-mono uppercase',
        !src && 'bg-muted',
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} className="size-full object-cover" alt="" />
      ) : (
        <span className="content-center text-center text-[70%]">
          {fallback.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)}
        </span>
      )}
    </div>
  )
}
