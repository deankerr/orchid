import 'ldrs/react/Square.css'

import { Square } from 'ldrs/react'

import { cn } from '@/lib/utils'

export function LoaderSquare({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    // internal size doesn't account for stroke width, balance with padding
    <div className={cn('pr-1', className)} aria-label="Loading" {...props}>
      <Square
        size="35"
        stroke="5"
        strokeLength="0.25"
        bgOpacity="0.1"
        speed="1.2"
        color="#525252" // (= neutral-600) can't style this web component with tailwind or any CSS :)
      />
    </div>
  )
}
