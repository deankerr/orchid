import { ChevronsDownIcon } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function EndpointDerankedBadge({
  className,
  ...props
}: { className?: string } & React.ComponentProps<'div'>) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex size-5 items-center justify-center rounded-sm bg-warning/20 p-0.5 text-warning',
              className,
            )}
            {...props}
          >
            <ChevronsDownIcon className="size-full" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Deranked: Will only be used as a fallback</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
