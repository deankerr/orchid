import { ExternalLinkIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export function ExternalLink({ children, className, ...props }: React.ComponentProps<'a'>) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-baseline gap-1.5 underline-offset-2 hover:underline',
        className,
      )}
      {...props}
    >
      <ExternalLinkIcon className="size-3.5 translate-y-0.5" />
      {children}
    </a>
  )
}
