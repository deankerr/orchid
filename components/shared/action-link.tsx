import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'

export function ActionLink({
  children,
  className,
  icon: Icon = Search,
  ...props
}: React.ComponentProps<'button'> & { icon?: React.ElementType }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 text-primary underline decoration-primary/40 decoration-dashed underline-offset-3 hover:decoration-solid cursor-pointer bg-transparent border-0 p-0 text-xs font-mono uppercase',
        className,
      )}
      {...props}
    >
      {children}
      <Icon className="size-3" />
    </button>
  )
}

