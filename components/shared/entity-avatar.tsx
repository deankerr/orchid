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
  return (
    <Avatar className={cn('size-6 shrink-0 rounded-sm', className)} {...props}>
      {src && <AvatarImage src={src} />}
      <AvatarFallback className="rounded-sm font-mono text-sm uppercase">
        {fallback.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  )
}
