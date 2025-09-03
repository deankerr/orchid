import { getImageProps } from 'next/image'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function EntityAvatar({
  src,
  fallback,
  className,
  ...props
}: {
  src: string
  fallback: string
} & React.ComponentProps<typeof Avatar>) {
  const { props: imageProps } = getImageProps({
    src,
    alt: '', // adjacent to entity name
    width: 24,
    height: 24,
  })

  return (
    <Avatar className={cn('size-6 shrink-0 rounded-sm', className)} {...props}>
      <AvatarImage {...imageProps} />
      <AvatarFallback className="rounded-sm font-mono text-sm uppercase">
        {fallback.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  )
}
