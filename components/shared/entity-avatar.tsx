import Image from 'next/image'

import { cn } from '@/lib/utils'

export function EntityAvatar({
  icon_url,
  fallbackText,
  className,
  ...props
}: {
  icon_url: string | undefined
  fallbackText: string
} & React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex w-6 shrink-0 items-center', className)} {...props}>
      {icon_url ? (
        <Image
          src={icon_url}
          alt=""
          width={32}
          height={32}
          unoptimized
          className="aspect-square w-full"
        />
      ) : (
        <div className="grid aspect-square w-full place-content-center rounded-sm bg-muted px-0.5 font-mono text-[90%]">
          {fallbackText.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)}
        </div>
      )}
    </div>
  )
}
