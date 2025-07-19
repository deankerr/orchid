import { Badge } from '../../ui/badge'

export function ParametersSection({ parameters }: { parameters: string[] }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground uppercase">
        supported parameters
      </div>
      <div className="flex flex-wrap gap-2">
        {parameters.map((parameter) => (
          <Badge key={parameter} variant="secondary" className="rounded-none">
            {parameter}
          </Badge>
        ))}
      </div>
    </div>
  )
}
