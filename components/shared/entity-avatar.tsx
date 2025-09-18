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
      className={cn('grid size-6 shrink-0 place-content-stretch rounded-sm', className)}
      {...props}
    >
      {src ? (
        <img src={src} className="size-full object-cover" alt="" />
      ) : (
        <span className="content-center bg-muted text-center font-mono text-sm uppercase">
          {fallback.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)}
        </span>
      )}
    </div>
  )
}
