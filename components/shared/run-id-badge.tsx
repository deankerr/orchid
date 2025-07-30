import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface RunIdBadgeProps {
  runId: string
  className?: string
}

export function RunIdBadge({ runId, className }: RunIdBadgeProps) {
  const truncatedId = runId.slice(0, 7)
  
  return (
    <Badge 
      variant="outline" 
      className={cn("font-mono text-xs", className)}
      title={runId} // Show full ID on hover
    >
      {truncatedId}
    </Badge>
  )
}