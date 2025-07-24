import 'ldrs/react/Square.css'

import { Square } from 'ldrs/react'
import { Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Badge } from '../ui/badge'

export function LoaderSquare({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('-translate-x-0.5 -translate-y-4', className)}
      aria-label="Loading"
      {...props}
    >
      <Square
        size="35"
        stroke="5"
        strokeLength="0.25"
        bgOpacity="0.1"
        speed="1.2"
        color="#525252"
      />
    </div>
  )
}

export function LoaderBadge({ className, ...props }: React.ComponentProps<typeof Badge>) {
  return (
    <Badge variant="outline" className={cn('font-mono', className)} {...props}>
      <Loader2Icon className="animate-spin" />
      Loading
    </Badge>
  )
}
