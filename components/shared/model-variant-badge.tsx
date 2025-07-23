import { cn } from '@/lib/utils'

import { Badge } from '../ui/badge'

export function ModelVariantBadge({
  modelVariant,
  className,
  ...props
}: { modelVariant?: string } & React.ComponentProps<typeof Badge>) {
  if (!modelVariant || modelVariant === 'standard') return null
  return (
    <Badge variant="outline" className={cn('font-mono', className)} {...props}>
      :{modelVariant}
    </Badge>
  )
}
